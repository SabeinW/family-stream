const express = require('express');
const prisma = require('../utils/prisma');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.notification.count({ where: { userId: req.user.userId, read: false } }),
  ]);
  res.json({ notifications, unreadCount });
});

router.post('/:id/read', requireAuth, async (req, res) => {
  await prisma.notification.updateMany({
    where: { id: req.params.id, userId: req.user.userId },
    data: { read: true },
  });
  res.json({ ok: true });
});

router.post('/read-all', requireAuth, async (req, res) => {
  await prisma.notification.updateMany({
    where: { userId: req.user.userId, read: false },
    data: { read: true },
  });
  res.json({ ok: true });
});

module.exports = router;
