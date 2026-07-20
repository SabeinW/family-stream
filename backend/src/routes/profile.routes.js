const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuid } = require('uuid');
const prisma = require('../utils/prisma');
const { requireAuth, requireAuthFlexible } = require('../middleware/auth');

const router = express.Router();

const AVATARS = path.join(__dirname, '..', 'uploads', 'avatars');

const avatarUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, AVATARS),
    filename: (req, file, cb) => cb(null, `${uuid()}${path.extname(file.originalname)}`),
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB is plenty for a profile photo
  fileFilter: (req, file, cb) => {
    const ok = /^image\//.test(file.mimetype);
    cb(ok ? null : new Error('Only image files are allowed.'), ok);
  },
});

const PROFILE_FIELDS = { id: true, name: true, avatarColor: true, avatarPath: true, isKid: true, pinHash: true };

// List all profiles belonging to the logged-in account ("Who's watching?")
router.get('/', requireAuth, async (req, res) => {
  const profiles = await prisma.profile.findMany({
    where: { userId: req.user.userId },
    select: PROFILE_FIELDS,
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

// Rename a profile and/or change its fallback color (used when no photo is set).
router.patch('/:id', requireAuth, async (req, res) => {
  const profile = await prisma.profile.findFirst({
    where: { id: req.params.id, userId: req.user.userId },
  });
  if (!profile) return res.status(404).json({ error: 'Profile not found.' });

  const { name, avatarColor } = req.body;
  const data = {};
  if (name !== undefined) {
    if (!name.trim()) return res.status(400).json({ error: 'Profile name cannot be empty.' });
    data.name = name.trim();
  }
  if (avatarColor !== undefined) data.avatarColor = avatarColor;

  const updated = await prisma.profile.update({
    where: { id: profile.id },
    data,
    select: PROFILE_FIELDS,
  });
  res.json({ ...updated, hasPin: !!updated.pinHash, pinHash: undefined });
});

// Upload/replace this profile's photo.
router.post('/:id/avatar', requireAuth, avatarUpload.single('avatar'), async (req, res) => {
  const profile = await prisma.profile.findFirst({
    where: { id: req.params.id, userId: req.user.userId },
  });
  if (!profile) return res.status(404).json({ error: 'Profile not found.' });
  if (!req.file) return res.status(400).json({ error: 'No image uploaded.' });

  if (profile.avatarPath) {
    const oldPath = path.join(AVATARS, profile.avatarPath);
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }

  const updated = await prisma.profile.update({
    where: { id: profile.id },
    data: { avatarPath: req.file.filename },
    select: PROFILE_FIELDS,
  });
  res.json({ ...updated, hasPin: !!updated.pinHash, pinHash: undefined });
});

// GET /api/profiles/:id/avatar?token=<account JWT> — <img> tags can't set
// an Authorization header, so requireAuthFlexible also accepts it as a
// query param (same header-or-query pattern used for the profile token).
router.get('/:id/avatar', requireAuthFlexible, async (req, res) => {
  const profile = await prisma.profile.findFirst({
    where: { id: req.params.id, userId: req.user.userId },
  });
  if (!profile || !profile.avatarPath) return res.status(404).end();
  const filePath = path.join(AVATARS, profile.avatarPath);
  if (!fs.existsSync(filePath)) return res.status(404).end();
  res.set('Cache-Control', 'private, max-age=86400');
  res.sendFile(filePath);
});

router.delete('/:id', requireAuth, async (req, res) => {
  const profile = await prisma.profile.findFirst({
    where: { id: req.params.id, userId: req.user.userId },
  });
  if (!profile) return res.status(404).json({ error: 'Profile not found.' });
  if (profile.avatarPath) {
    const oldPath = path.join(AVATARS, profile.avatarPath);
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }
  await prisma.profile.delete({ where: { id: profile.id } });
  res.json({ ok: true });
});

// Select a profile -> issue a profile token used for personalized requests
// (favorites, watch progress, streaming, thumbnails, downloads).
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

  // Matches the account token's 30d lifetime — there's no security reason
  // for this to be shorter (it doesn't grant anything the account token
  // doesn't already grant), and a short lifetime meant every image on the
  // page silently broke every 12h with no visible error until the user
  // logged back in.
  const profileToken = jwt.sign(
    { profileId: profile.id, userId: req.user.userId },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );

  res.json({
    profileToken,
    profile: { id: profile.id, name: profile.name, avatarColor: profile.avatarColor, avatarPath: profile.avatarPath },
  });
});

module.exports = router;
