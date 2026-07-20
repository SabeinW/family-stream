const express = require('express');
const fs = require('fs');
const path = require('path');
const prisma = require('../utils/prisma');
const { requireAuth, requireAuthFlexible } = require('../middleware/auth');
const { normalizePhone, isValidPhone } = require('../utils/phone');
const { notify } = require('../utils/notify');

const router = express.Router();
const AVATARS = path.join(__dirname, '..', 'uploads', 'avatars');

// Order-independent key so A->B and B->A can never exist as separate rows —
// a plain @@unique([requesterId, addresseeId]) only blocks one direction.
function pairKey(a, b) {
  return [a, b].sort().join(':');
}

// A friend's "picture" is their account's earliest profile's avatar —
// accounts can have several "Who's watching?" profiles, but the friends
// system operates at the account level, so we just need *a* representative
// image, not a specific one.
function otherUser(friendship, myId) {
  const isRequester = friendship.requesterId === myId;
  const other = isRequester ? friendship.addressee : friendship.requester;
  const primaryProfile = other.profiles[0];
  return {
    friendshipId: friendship.id,
    userId: other.id,
    email: other.email,
    username: other.username,
    avatarColor: primaryProfile?.avatarColor || null,
    avatarPath: primaryProfile?.avatarPath || null,
  };
}

// Deletes any MediaShare/PlaylistShare rows between two users in both
// directions — these don't auto-revoke just because a friendship ends.
async function purgeSharesBetween(userA, userB) {
  await prisma.mediaShare.deleteMany({
    where: {
      OR: [
        { userId: userA, media: { ownerId: userB } },
        { userId: userB, media: { ownerId: userA } },
      ],
    },
  });
  // PlaylistShare doesn't exist yet (ships with playlists) — guarded so this
  // function doesn't need to change when that table is added.
  if (prisma.playlistShare) {
    await prisma.playlistShare.deleteMany({
      where: {
        OR: [
          { userId: userA, playlist: { ownerId: userB } },
          { userId: userB, playlist: { ownerId: userA } },
        ],
      },
    });
  }
}

router.get('/', requireAuth, async (req, res) => {
  const me = req.user.userId;
  const rows = await prisma.friendship.findMany({
    where: { OR: [{ requesterId: me }, { addresseeId: me }] },
    include: {
      requester: {
        select: { id: true, email: true, username: true, profiles: { take: 1, orderBy: { createdAt: 'asc' }, select: { avatarColor: true, avatarPath: true } } },
      },
      addressee: {
        select: { id: true, email: true, username: true, profiles: { take: 1, orderBy: { createdAt: 'asc' }, select: { avatarColor: true, avatarPath: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const friends = rows.filter((f) => f.status === 'accepted').map((f) => otherUser(f, me));
  const incoming = rows.filter((f) => f.status === 'pending' && f.addresseeId === me).map((f) => otherUser(f, me));
  const outgoing = rows.filter((f) => f.status === 'pending' && f.requesterId === me).map((f) => otherUser(f, me));

  res.json({ friends, incoming, outgoing });
});

router.post('/request', requireAuth, async (req, res) => {
  const me = req.user.userId;
  // Accepts an email, a @username, or a phone number — username/phone are
  // both optional and self-reported, so this falls back to email-only
  // matching for accounts that haven't set either.
  const identifier = String(req.body.identifier || req.body.email || '').trim();
  if (!identifier) return res.status(400).json({ error: 'Email, username, or phone number is required.' });

  const usernameGuess = identifier.replace(/^@/, '').toLowerCase();
  const phoneGuess = normalizePhone(identifier);
  const target = await prisma.user.findFirst({
    where: {
      OR: [
        { email: identifier },
        { username: usernameGuess },
        ...(isValidPhone(phoneGuess) ? [{ phone: phoneGuess }] : []),
      ],
    },
  });
  if (!target) return res.status(404).json({ error: 'No account found with that email, username, or phone number.' });
  if (target.id === me) return res.status(400).json({ error: "You can't friend yourself." });

  const key = pairKey(me, target.id);
  const existing = await prisma.friendship.findUnique({ where: { pairKey: key } });

  if (existing) {
    if (existing.status === 'accepted') return res.status(409).json({ error: 'You are already friends.' });
    if (existing.requesterId === me) return res.status(409).json({ error: 'Request already sent.' });
    // They already requested me — accept it now instead of making them wait.
    await prisma.friendship.update({ where: { id: existing.id }, data: { status: 'accepted' } });
    notify(existing.requesterId, 'friend_accept', `${req.user.email} accepted your friend request.`, '/friends');
    return res.json({ status: 'accepted' });
  }

  await prisma.friendship.create({
    data: { requesterId: me, addresseeId: target.id, status: 'pending', pairKey: key },
  });
  notify(target.id, 'friend_request', `${req.user.email} sent you a friend request.`, '/friends');
  res.status(201).json({ status: 'pending' });
});

router.post('/:id/accept', requireAuth, async (req, res) => {
  const friendship = await prisma.friendship.findFirst({
    where: { id: req.params.id, addresseeId: req.user.userId, status: 'pending' },
  });
  if (!friendship) return res.status(404).json({ error: 'Request not found.' });
  await prisma.friendship.update({ where: { id: friendship.id }, data: { status: 'accepted' } });
  notify(friendship.requesterId, 'friend_accept', `${req.user.email} accepted your friend request.`, '/friends');
  res.json({ ok: true });
});

router.post('/:id/decline', requireAuth, async (req, res) => {
  const friendship = await prisma.friendship.findFirst({
    where: { id: req.params.id, addresseeId: req.user.userId, status: 'pending' },
  });
  if (!friendship) return res.status(404).json({ error: 'Request not found.' });
  // Delete rather than mark declined, so the same pair can cleanly re-request later.
  await prisma.friendship.delete({ where: { id: friendship.id } });
  res.json({ ok: true });
});

// Unfriend (accepted) or cancel an outgoing request (pending) — either party.
router.delete('/:id', requireAuth, async (req, res) => {
  const me = req.user.userId;
  const friendship = await prisma.friendship.findFirst({
    where: { id: req.params.id, OR: [{ requesterId: me }, { addresseeId: me }] },
  });
  if (!friendship) return res.status(404).json({ error: 'Not found.' });

  await prisma.friendship.delete({ where: { id: friendship.id } });
  if (friendship.status === 'accepted') {
    await purgeSharesBetween(friendship.requesterId, friendship.addresseeId);
  }
  res.json({ ok: true });
});

// GET /api/friends/:userId/avatar?token=<account JWT> — serves a friend's
// primary profile photo. Scoped to an *accepted* friendship rather than
// ownership (unlike /api/profiles/:id/avatar, which is owner-only) — <img>
// tags can't set an Authorization header, so requireAuthFlexible also
// accepts the token as a query param.
router.get('/:userId/avatar', requireAuthFlexible, async (req, res) => {
  const me = req.user.userId;
  const targetId = req.params.userId;

  const friendship = await prisma.friendship.findFirst({
    where: {
      status: 'accepted',
      OR: [
        { requesterId: me, addresseeId: targetId },
        { requesterId: targetId, addresseeId: me },
      ],
    },
  });
  if (!friendship) return res.status(404).end();

  const profile = await prisma.profile.findFirst({
    where: { userId: targetId },
    orderBy: { createdAt: 'asc' },
    select: { avatarPath: true },
  });
  if (!profile?.avatarPath) return res.status(404).end();

  const filePath = path.join(AVATARS, profile.avatarPath);
  if (!fs.existsSync(filePath)) return res.status(404).end();
  res.set('Cache-Control', 'private, max-age=86400');
  res.sendFile(filePath);
});

module.exports = router;
