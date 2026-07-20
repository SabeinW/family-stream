const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');
const { requireAuth } = require('../middleware/auth');
const { normalizePhone, isValidPhone } = require('../utils/phone');

const router = express.Router();
const TOKEN_TTL = '30d';
const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password || password.length < 8) {
      return res.status(400).json({ error: 'Email and an 8+ character password are required.' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'An account with that email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        // Every new account starts with one default profile.
        profiles: { create: { name: 'Family', avatarColor: '#E50914' } },
      },
      include: { profiles: true },
    });

    const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: TOKEN_TTL,
    });

    res.status(201).json({ token, user: { id: user.id, email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: TOKEN_TTL,
    });

    res.json({ token, user: { id: user.id, email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed.' });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    select: { id: true, email: true, username: true, phone: true },
  });
  if (!user) return res.status(404).json({ error: 'Account not found.' });
  res.json(user);
});

router.patch('/username', requireAuth, async (req, res) => {
  const username = String(req.body.username || '').trim().toLowerCase();
  if (!USERNAME_RE.test(username)) {
    return res.status(400).json({
      error: 'Username must be 3-20 characters: lowercase letters, numbers, and underscores only.',
    });
  }

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing && existing.id !== req.user.userId) {
    return res.status(409).json({ error: 'That username is already taken.' });
  }

  const user = await prisma.user.update({
    where: { id: req.user.userId },
    data: { username },
    select: { id: true, email: true, username: true, phone: true },
  });
  res.json(user);
});

// Phone numbers here are self-reported and NOT verified via SMS (no SMS
// provider is wired up) — this is purely a lookup convenience with the same
// trust level as username, not a verified contact method.
router.patch('/phone', requireAuth, async (req, res) => {
  const normalized = normalizePhone(req.body.phone);
  if (!isValidPhone(normalized)) {
    return res.status(400).json({ error: 'Enter a valid phone number (7-15 digits).' });
  }

  const existing = await prisma.user.findUnique({ where: { phone: normalized } });
  if (existing && existing.id !== req.user.userId) {
    return res.status(409).json({ error: 'That phone number is already in use.' });
  }

  const user = await prisma.user.update({
    where: { id: req.user.userId },
    data: { phone: normalized },
    select: { id: true, email: true, username: true, phone: true },
  });
  res.json(user);
});

module.exports = router;
