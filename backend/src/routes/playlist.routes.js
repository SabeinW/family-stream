const express = require('express');
const prisma = require('../utils/prisma');
const { requireAuth } = require('../middleware/auth');
const {
  getFriendIds,
  mediaAccessWhere,
  canAccessMedia,
  playlistAccessWhere,
  canAccessPlaylist,
  VALID_VISIBILITIES,
} = require('../utils/access');
const { notify } = require('../utils/notify');

const router = express.Router();

// Filters a playlist's items down to what `userId` can actually see. Owning
// (or being able to see) the playlist never implies access to every item
// inside it — each item's underlying Media has its own independent
// visibility, which can be narrower than the playlist's (or have been
// revoked since the item was added). Skipping this check would let someone
// add another person's private media into their own friends-visible
// playlist and leak it to their whole friend list.
//
// Also excludes items still `processing` (or `failed`) — a freshly
// uploaded video has no streamPath yet, so showing it immediately would
// just be a broken-looking card; it appears on its own once transcoding
// finishes, same as everywhere else in the app.
async function visibleItems(userId, items) {
  const out = [];
  for (const item of items) {
    if (item.media.status === 'ready' && (await canAccessMedia(userId, item.media))) out.push(item);
  }
  return out;
}

router.get('/', requireAuth, async (req, res) => {
  const me = req.user.userId;
  const friendIds = await getFriendIds(me);
  const playlists = await prisma.playlist.findMany({
    where: playlistAccessWhere(me, friendIds),
    include: {
      items: { orderBy: { addedAt: 'desc' }, take: 8, include: { media: true } },
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const out = [];
  for (const p of playlists) {
    const visible = (await visibleItems(me, p.items)).slice(0, 4);
    out.push({
      id: p.id,
      name: p.name,
      ownerId: p.ownerId,
      visibility: p.visibility,
      coverColor: p.coverColor,
      itemCount: p._count.items,
      coverThumbnails: visible.map((i) => ({ mediaId: i.media.id, thumbnailPath: i.media.thumbnailPath, type: i.media.type })),
    });
  }
  res.json(out);
});

router.post('/', requireAuth, async (req, res) => {
  const { name, coverColor } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Playlist name is required.' });

  const playlist = await prisma.playlist.create({
    data: {
      name: name.trim(),
      ownerId: req.user.userId,
      coverColor: coverColor || undefined,
    },
  });
  res.status(201).json(playlist);
});

router.get('/:id', requireAuth, async (req, res) => {
  const me = req.user.userId;
  const playlist = await prisma.playlist.findUnique({
    where: { id: req.params.id },
    include: {
      items: { orderBy: { addedAt: 'desc' }, include: { media: true } },
      shares: { select: { userId: true } },
    },
  });
  if (!playlist || !(await canAccessPlaylist(me, playlist))) {
    return res.status(404).json({ error: 'Not found.' });
  }

  const items = await visibleItems(me, playlist.items);
  res.json({
    id: playlist.id,
    name: playlist.name,
    ownerId: playlist.ownerId,
    visibility: playlist.visibility,
    coverColor: playlist.coverColor,
    shares: playlist.shares,
    hiddenCount: playlist.items.length - items.length,
    items: items.map((i) => i.media),
  });
});

router.patch('/:id', requireAuth, async (req, res) => {
  const playlist = await prisma.playlist.findUnique({ where: { id: req.params.id } });
  if (!playlist || playlist.ownerId !== req.user.userId) {
    return res.status(404).json({ error: 'Not found.' });
  }

  const { name, coverColor, visibility, shareWith } = req.body;
  const data = {};
  if (name !== undefined) {
    if (!name.trim()) return res.status(400).json({ error: 'Playlist name cannot be empty.' });
    data.name = name.trim();
  }
  if (coverColor !== undefined) data.coverColor = coverColor;

  let targetUserIds = null;
  let previouslySharedWith = new Set();
  if (visibility !== undefined) {
    if (!VALID_VISIBILITIES.includes(visibility)) {
      return res.status(400).json({ error: 'Invalid visibility value.' });
    }
    data.visibility = visibility;
    if (visibility === 'custom') {
      const requested = Array.isArray(shareWith) ? [...new Set(shareWith)] : [];
      const friendIds = await getFriendIds(req.user.userId);
      if (requested.some((id) => !friendIds.includes(id))) {
        return res.status(400).json({ error: 'Can only share with current friends.' });
      }
      targetUserIds = requested;
      const previousShares = await prisma.playlistShare.findMany({ where: { playlistId: playlist.id }, select: { userId: true } });
      previouslySharedWith = new Set(previousShares.map((s) => s.userId));
    } else {
      targetUserIds = [];
    }
  }

  await prisma.$transaction([
    prisma.playlist.update({ where: { id: playlist.id }, data }),
    ...(targetUserIds !== null
      ? [
          prisma.playlistShare.deleteMany({ where: { playlistId: playlist.id } }),
          ...(targetUserIds.length
            ? [prisma.playlistShare.createMany({ data: targetUserIds.map((userId) => ({ playlistId: playlist.id, userId })) })]
            : []),
        ]
      : []),
  ]);

  if (targetUserIds) {
    for (const userId of targetUserIds) {
      if (!previouslySharedWith.has(userId)) {
        notify(userId, 'playlist_shared', `${req.user.email} shared the playlist "${playlist.name}" with you.`, `/playlists/${playlist.id}`);
      }
    }
  }

  const updated = await prisma.playlist.findUnique({
    where: { id: playlist.id },
    include: { shares: { select: { userId: true } } },
  });
  res.json(updated);
});

router.delete('/:id', requireAuth, async (req, res) => {
  const playlist = await prisma.playlist.findUnique({ where: { id: req.params.id } });
  if (!playlist || playlist.ownerId !== req.user.userId) {
    return res.status(404).json({ error: 'Not found.' });
  }
  await prisma.playlist.delete({ where: { id: playlist.id } }); // cascades items/shares
  res.json({ ok: true });
});

router.post('/:id/items', requireAuth, async (req, res) => {
  const me = req.user.userId;
  const playlist = await prisma.playlist.findUnique({ where: { id: req.params.id } });
  if (!playlist || playlist.ownerId !== me) return res.status(404).json({ error: 'Not found.' });

  const { mediaId } = req.body;
  const media = await prisma.media.findUnique({ where: { id: mediaId } });
  if (!media || !(await canAccessMedia(me, media))) {
    return res.status(404).json({ error: 'Media not found.' });
  }

  const item = await prisma.playlistItem.upsert({
    where: { playlistId_mediaId: { playlistId: playlist.id, mediaId } },
    update: {},
    create: { playlistId: playlist.id, mediaId },
  });
  res.status(201).json(item);

  // Let people who already have this playlist notice new items land in it —
  // not a share event, so no "shared with you" duplicate for people who
  // already had access.
  if (playlist.visibility === 'friends') {
    const friendIds = await getFriendIds(me);
    for (const userId of friendIds) {
      notify(userId, 'playlist_item_added', `${req.user.email} added "${media.title}" to "${playlist.name}".`, `/playlists/${playlist.id}`);
    }
  } else if (playlist.visibility === 'custom') {
    const shares = await prisma.playlistShare.findMany({ where: { playlistId: playlist.id }, select: { userId: true } });
    for (const { userId } of shares) {
      notify(userId, 'playlist_item_added', `${req.user.email} added "${media.title}" to "${playlist.name}".`, `/playlists/${playlist.id}`);
    }
  }
});

router.delete('/:id/items/:mediaId', requireAuth, async (req, res) => {
  const playlist = await prisma.playlist.findUnique({ where: { id: req.params.id } });
  if (!playlist || playlist.ownerId !== req.user.userId) {
    return res.status(404).json({ error: 'Not found.' });
  }
  await prisma.playlistItem
    .delete({ where: { playlistId_mediaId: { playlistId: playlist.id, mediaId: req.params.mediaId } } })
    .catch(() => {}); // already removed — treat as success
  res.json({ ok: true });
});

module.exports = router;
