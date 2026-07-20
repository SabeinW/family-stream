const prisma = require('./prisma');

function notify(userId, type, message, link) {
  // Fire-and-forget from the caller's perspective — a notification failing
  // to write should never break the action that triggered it (accepting a
  // friend request, sharing a photo, etc).
  return prisma.notification.create({ data: { userId, type, message, link } }).catch((err) => {
    console.error('[notify] failed to create notification:', err);
  });
}

module.exports = { notify };
