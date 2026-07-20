const prisma = require('./prisma');

const VALID_VISIBILITIES = ['private', 'friends', 'custom'];

// Ids of every account with an accepted (mutual) friendship with `userId`.
async function getFriendIds(userId) {
  const rows = await prisma.friendship.findMany({
    where: { status: 'accepted', OR: [{ requesterId: userId }, { addresseeId: userId }] },
    select: { requesterId: true, addresseeId: true },
  });
  return rows.map((f) => (f.requesterId === userId ? f.addresseeId : f.requesterId));
}

// Prisma `where` fragment for "media visible to userId" — combine with
// `AND: [existingFilters, mediaAccessWhere(...)]`.
function mediaAccessWhere(userId, friendIds) {
  return {
    OR: [
      { ownerId: userId },
      { ownerId: null }, // unmigrated/orphaned rows — fail-open by design, see backfillOwners.js
      { visibility: 'friends', ownerId: { in: friendIds } },
      { visibility: 'custom', shares: { some: { userId } } },
    ],
  };
}

// Single-item access check, used by GET/:id, stream routes, favorite/progress.
async function canAccessMedia(userId, media) {
  if (!media) return false;
  // Short-circuit before touching Friendship — this runs on every video-seek
  // Range request, so ownership (the overwhelmingly common case) stays a
  // single cheap comparison instead of a DB round trip.
  if (media.ownerId === userId || media.ownerId == null) return true;
  if (media.visibility === 'friends') {
    const friendIds = await getFriendIds(userId);
    return friendIds.includes(media.ownerId);
  }
  if (media.visibility === 'custom') {
    const share = await prisma.mediaShare.findUnique({
      where: { mediaId_userId: { mediaId: media.id, userId } },
    });
    return !!share;
  }
  return false;
}

// Same shape as mediaAccessWhere, but Playlist.ownerId is never null (no
// legacy-migration fail-open case — playlists didn't exist before this).
function playlistAccessWhere(userId, friendIds) {
  return {
    OR: [
      { ownerId: userId },
      { visibility: 'friends', ownerId: { in: friendIds } },
      { visibility: 'custom', shares: { some: { userId } } },
    ],
  };
}

async function canAccessPlaylist(userId, playlist) {
  if (!playlist) return false;
  if (playlist.ownerId === userId) return true;
  if (playlist.visibility === 'friends') {
    const friendIds = await getFriendIds(userId);
    return friendIds.includes(playlist.ownerId);
  }
  if (playlist.visibility === 'custom') {
    const share = await prisma.playlistShare.findUnique({
      where: { playlistId_userId: { playlistId: playlist.id, userId } },
    });
    return !!share;
  }
  return false;
}

module.exports = {
  VALID_VISIBILITIES,
  getFriendIds,
  mediaAccessWhere,
  canAccessMedia,
  playlistAccessWhere,
  canAccessPlaylist,
};
