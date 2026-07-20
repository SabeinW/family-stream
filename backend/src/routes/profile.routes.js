const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// List all profiles belonging to the logged-in account ("Who's watching?")
router.get('/', requireAuth, async (req, res) => {
  const profiles = await prisma.profile.findMany({
    where: { userId: req.user.userId },
    select: { id: true, name: true, avatarColor: true, isKid: true, pinHash: true },
  });
  res.json(profiles.map((p) => ({ ...p, hasPin: !!p.pinHash, pinHash: undefined })));
});

router.post('/', requireAuth, async (req, res) => {
  const { name, avatarColor, isKid, pin } = req.body;
  if (!name) return res.status(400).json({ error: 'Profile name is required.' });

  const count = await prisma.profile.count({ where: { userId: req.user.userId } });
  if (count >= 5) {
    return res.status(400).json({ error: 'Maximum of 5 profiles per account.' });
  }

  const pinHash = pin ? await bcrypt.hash(String(pin), 10) : null;
  const profile = await prisma.profile.create({
    data: {
      name,
      avatarColor: avatarColor || '#E50914',
      isKid: !!isKid,
      pinHash,
      userId: req.user.userId,
    },
  });
  res.status(201).json(profile);
});

router.delete('/:id', requireAuth, async (req, res) => {
  const profile = await prisma.profile.findFirst({
    where: { id: req.params.id, userId: req.user.userId },
  });
  if (!profile) return res.status(404).json({ error: 'Profile not found.' });
  await prisma.profile.delete({ where: { id: profile.id } });
  res.json({ ok: true });
});

// Select a profile -> issue a short-lived profile token used for
// personalized requests (favorites, watch progress, streaming).
router.post('/:id/select', requireAuth, async (req, res) => {
  const profile = await prisma.profile.findFirst({
    where: { id: req.params.id, userId: req.user.userId },
  });
  if (!profile) return res.status(404).json({ error: 'Profile not found.' });

  if (profile.pinHash) {
    const { pin } = req.body;
    const valid = pin && (await bcrypt.compare(String(pin), profile.pinHash));
    if (!valid) return res.status(401).json({ error: 'Incorrect PIN.' });
  }

  const profileToken = jwt.sign(
    { profileId: profile.id, userId: req.user.userId },
    process.env.JWT_SECRET,
    { expiresIn: '12h' }
  );

  res.json({ profileToken, profile: { id: profile.id, name: profile.name, avatarColor: profile.avatarColor } });
});

module.exports = router;
