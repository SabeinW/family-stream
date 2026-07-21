const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuid } = require('uuid');
const prisma = require('../utils/prisma');
const { requireAuth, requireProfile } = require('../middleware/auth');
const { transcodeLadder, probe, generateThumbnail } = require('../utils/ffmpeg');
const { getFriendIds, mediaAccessWhere, canAccessMedia, VALID_VISIBILITIES } = require('../utils/access');
const { notify } = require('../utils/notify');

const router = express.Router();

const UPLOAD_ROOT = path.join(__dirname, '..', 'uploads');
const ORIGINALS = path.join(UPLOAD_ROOT, 'originals');
const TRANSCODED = path.join(UPLOAD_ROOT, 'transcoded');
const THUMBS = path.join(UPLOAD_ROOT, 'thumbnails');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, ORIGINALS),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuid()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 * 1024 }, // 5GB ceiling for family video files
  fileFilter: (req, file, cb) => {
    const ok = /^(video|image)\//.test(file.mimetype);
    cb(ok ? null : new Error('Only video or image files are allowed.'), ok);
  },
});

// POST /api/media/upload  (multipart/form-data: file, title, category, tags)
router.post('/upload', requireAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });

    const { title, category, tags, description, takenAt, visibility } = req.body;
    const isVideo = req.file.mimetype.startsWith('video/');

    const media = await prisma.media.create({
      data: {
        title: title || req.file.originalname,
        description: description || null,
        type: isVideo ? 'video' : 'photo',
        category: category || 'Uncategorized',
        tags: tags || '',
        originalPath: req.file.filename,
        status: isVideo ? 'processing' : 'ready',
        uploadedBy: req.user.email,
        takenAt: takenAt ? new Date(takenAt) : null,
        // Photos serve directly from originals; no transcode needed.
        streamPath: isVideo ? null : req.file.filename,
        // Ownership is derived only from the verified JWT, never from any
        // client-supplied field, so uploads can't be attributed to someone
        // else. "custom" isn't offered at upload time (no share list yet to
        // attach), only afterward via PATCH /:id/visibility.
        ownerId: req.user.userId,
        visibility: visibility === 'friends' ? 'friends' : 'private',
      },
    });

    res.status(202).json({ media, message: isVideo ? 'Uploaded — processing for streaming.' : 'Uploaded.' });

    // Fire-and-forget background processing so the upload response is instant.
    if (isVideo) processVideoInBackground(media.id, req.file.filename);
    else generatePhotoThumbnail(media.id, req.file.filename);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Upload failed.' });
  }
});

async function processVideoInBackground(mediaId, filename) {
  const inputPath = path.join(ORIGINALS, filename);
  const baseName = path.parse(filename).name;
  const thumbName = `${baseName}.jpg`;

  try {
    const meta = await probe(inputPath);
    const renditions = await transcodeLadder(inputPath, TRANSCODED, baseName, meta.height);
    await generateThumbnail(inputPath, THUMBS, thumbName);

    // Highest-quality rendition becomes the default/fallback stream.
    const best = renditions[0];

    await prisma.$transaction([
      prisma.videoRendition.createMany({
        data: renditions.map((r) => ({ mediaId, quality: r.quality, path: r.path, height: r.height })),
      }),
      prisma.media.update({
        where: { id: mediaId },
        data: {
          streamPath: best.path,
          thumbnailPath: thumbName,
          durationSec: meta.durationSec,
          width: meta.width,
          height: meta.height,
          status: 'ready',
        },
      }),
    ]);
  } catch (err) {
    console.error(`Transcode failed for ${mediaId}:`, err);
    await prisma.media.update({ where: { id: mediaId }, data: { status: 'failed' } });
  }
}

async function generatePhotoThumbnail(mediaId, filename) {
  // Photos are served as-is; thumbnailPath just mirrors the original for now.
  await prisma.media.update({ where: { id: mediaId }, data: { thumbnailPath: filename } });
}

// GET /api/media?search=&category=&type=&tag=
router.get('/', requireAuth, async (req, res) => {
  const { search, category, type, tag } = req.query;
  const filters = {
    status: 'ready',
    ...(category ? { category } : {}),
    ...(type ? { type } : {}),
    ...(tag ? { tags: { contains: tag } } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search } },
            { description: { contains: search } },
            { tags: { contains: search } },
          ],
        }
      : {}),
  };

  const friendIds = await getFriendIds(req.user.userId);
  const media = await prisma.media.findMany({
    where: { AND: [filters, mediaAccessWhere(req.user.userId, friendIds)] },
    orderBy: { createdAt: 'desc' },
  });
  res.json(media);
});

router.get('/categories', requireAuth, async (req, res) => {
  const friendIds = await getFriendIds(req.user.userId);
  const rows = await prisma.media.findMany({
    where: { AND: [{ status: 'ready' }, mediaAccessWhere(req.user.userId, friendIds)] },
    select: { category: true },
    distinct: ['category'],
  });
  res.json(rows.map((r) => r.category));
});

router.get('/:id', requireAuth, async (req, res) => {
  const media = await prisma.media.findUnique({
    where: { id: req.params.id },
    include: { renditions: { orderBy: { height: 'desc' } }, shares: { select: { userId: true } } },
  });
  if (!media || !(await canAccessMedia(req.user.userId, media))) {
    return res.status(404).json({ error: 'Not found.' });
  }
  res.json(media);
});

// PATCH /api/media/:id  { title?, description?, category?, tags?, takenAt? }
router.patch('/:id', requireAuth, async (req, res) => {
  const media = await prisma.media.findUnique({ where: { id: req.params.id } });
  // Same as delete: owner-only, even for legacy ownerId=NULL rows.
  if (!media || media.ownerId !== req.user.userId) {
    return res.status(404).json({ error: 'Not found.' });
  }

  const { title, description, category, tags, takenAt } = req.body;
  const data = {};
  if (title !== undefined) {
    if (!title.trim()) return res.status(400).json({ error: 'Title cannot be empty.' });
    data.title = title.trim();
  }
  if (description !== undefined) data.description = description.trim() || null;
  if (category !== undefined) data.category = category.trim() || 'Uncategorized';
  if (tags !== undefined) data.tags = tags;
  if (takenAt !== undefined) data.takenAt = takenAt ? new Date(takenAt) : null;

  const updated = await prisma.media.update({ where: { id: media.id }, data });
  res.json(updated);
});

router.delete('/:id', requireAuth, async (req, res) => {
  const media = await prisma.media.findUnique({
    where: { id: req.params.id },
    include: { renditions: true },
  });
  // Stricter than read access: only the owner may delete, even for legacy
  // ownerId=NULL rows (those are fail-open for *reads* only, not deletes).
  if (!media || media.ownerId !== req.user.userId) {
    return res.status(404).json({ error: 'Not found.' });
  }

  [
    media.originalPath && path.join(ORIGINALS, media.originalPath),
    media.thumbnailPath && path.join(media.type === 'video' ? THUMBS : ORIGINALS, media.thumbnailPath),
    ...media.renditions.map((r) => path.join(TRANSCODED, r.path)),
  ]
    .filter(Boolean)
    .forEach((p) => fs.existsSync(p) && fs.unlinkSync(p));

  await prisma.media.delete({ where: { id: media.id } }); // cascades renditions/favorites/progress
  res.json({ ok: true });
});

// PATCH /api/media/:id/visibility  { visibility: 'private'|'friends'|'custom', shareWith?: string[] }
router.patch('/:id/visibility', requireAuth, async (req, res) => {
  const media = await prisma.media.findUnique({ where: { id: req.params.id } });
  if (!media || media.ownerId !== req.user.userId) {
    return res.status(404).json({ error: 'Not found.' });
  }

  const { visibility, shareWith } = req.body;
  if (!VALID_VISIBILITIES.includes(visibility)) {
    return res.status(400).json({ error: 'Invalid visibility value.' });
  }

  let targetUserIds = [];
  if (visibility === 'custom') {
    const requested = Array.isArray(shareWith) ? [...new Set(shareWith)] : [];
    const friendIds = await getFriendIds(req.user.userId);
    if (requested.some((id) => !friendIds.includes(id))) {
      return res.status(400).json({ error: 'Can only share with current friends.' });
    }
    targetUserIds = requested;
  }

  const previousShares = await prisma.mediaShare.findMany({ where: { mediaId: media.id }, select: { userId: true } });
  const previouslySharedWith = new Set(previousShares.map((s) => s.userId));

  // Always clear existing shares first, on every transition (not just when
  // landing on "custom"), so custom -> private -> custom can't resurrect
  // stale grants from before the visibility was changed away and back.
  await prisma.$transaction([
    prisma.mediaShare.deleteMany({ where: { mediaId: media.id } }),
    prisma.media.update({ where: { id: media.id }, data: { visibility } }),
    ...(targetUserIds.length
      ? [prisma.mediaShare.createMany({ data: targetUserIds.map((userId) => ({ mediaId: media.id, userId })) })]
      : []),
  ]);

  // Only notify people newly added to the share list, not on every re-save
  // of an unchanged list.
  for (const userId of targetUserIds) {
    if (!previouslySharedWith.has(userId)) {
      notify(userId, 'media_shared', `${req.user.email} shared "${media.title}" with you.`, `/watch/${media.id}`);
    }
  }

  const updated = await prisma.media.findUnique({
    where: { id: media.id },
    include: { shares: { select: { userId: true } } },
  });
  res.json(updated);
});

// --- Profile-scoped: favorites & watch progress ---

router.post('/:id/favorite', requireProfile, async (req, res) => {
  const { profileId, userId } = req.profile;
  const mediaId = req.params.id;

  const media = await prisma.media.findUnique({ where: { id: mediaId } });
  if (!(await canAccessMedia(userId, media))) return res.status(404).json({ error: 'Not found.' });

  const existing = await prisma.favorite.findUnique({
    where: { profileId_mediaId: { profileId, mediaId } },
  });
  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    return res.json({ favorited: false });
  }
  await prisma.favorite.create({ data: { profileId, mediaId } });
  res.json({ favorited: true });
});

router.get('/profile/favorites', requireProfile, async (req, res) => {
  const { profileId, userId } = req.profile;
  const favorites = await prisma.favorite.findMany({
    where: { profileId },
    include: { media: true },
    orderBy: { createdAt: 'desc' },
  });
  // Access may have been revoked (unshared/unfriended) since a favorite was
  // made, so re-check on every read rather than trusting the stored row.
  const accessible = [];
  for (const f of favorites) {
    if (await canAccessMedia(userId, f.media)) accessible.push(f.media);
  }
  res.json(accessible);
});

router.put('/:id/progress', requireProfile, async (req, res) => {
  const { positionSec } = req.body;
  const { profileId, userId } = req.profile;
  const mediaId = req.params.id;

  const media = await prisma.media.findUnique({ where: { id: mediaId } });
  if (!(await canAccessMedia(userId, media))) return res.status(404).json({ error: 'Not found.' });

  const progress = await prisma.watchProgress.upsert({
    where: { profileId_mediaId: { profileId, mediaId } },
    update: { positionSec },
    create: { profileId, mediaId, positionSec },
  });
  res.json(progress);
});

module.exports = router;
