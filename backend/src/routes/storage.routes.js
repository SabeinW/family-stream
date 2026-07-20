const express = require('express');
const fs = require('fs');
const path = require('path');
const prisma = require('../utils/prisma');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const UPLOAD_ROOT = path.join(__dirname, '..', 'uploads');
const ORIGINALS = path.join(UPLOAD_ROOT, 'originals');
const TRANSCODED = path.join(UPLOAD_ROOT, 'transcoded');
const THUMBS = path.join(UPLOAD_ROOT, 'thumbnails');

function fileSize(filePath) {
  try {
    return fs.statSync(filePath).size;
  } catch {
    return 0; // file missing on disk — don't let one bad row break the total
  }
}

// GET /api/storage/usage — this account's upload footprint plus overall
// disk usage on the volume uploads live on (useful context for a
// self-hosted server with a fixed disk). File sizes are read live from
// disk rather than stored in the DB, since nothing tracks them today and
// a family-scale library (dozens to low hundreds of files) makes that
// cheap enough to not need a schema change.
router.get('/usage', requireAuth, async (req, res) => {
  const mine = await prisma.media.findMany({
    where: { ownerId: req.user.userId },
    include: { renditions: true },
  });

  let videoBytes = 0;
  let photoBytes = 0;

  for (const m of mine) {
    let size = 0;
    if (m.originalPath) size += fileSize(path.join(ORIGINALS, m.originalPath));
    if (m.thumbnailPath) size += fileSize(path.join(m.type === 'video' ? THUMBS : ORIGINALS, m.thumbnailPath));
    for (const r of m.renditions) size += fileSize(path.join(TRANSCODED, r.path));

    if (m.type === 'video') videoBytes += size;
    else photoBytes += size;
  }

  let disk = null;
  try {
    const stat = fs.statfsSync(UPLOAD_ROOT);
    disk = { totalBytes: stat.blocks * stat.bsize, freeBytes: stat.bfree * stat.bsize };
  } catch {
    // statfs isn't available on every platform/Node build — degrade gracefully.
  }

  res.json({
    videoBytes,
    photoBytes,
    totalBytes: videoBytes + photoBytes,
    itemCount: mine.length,
    disk,
  });
});

module.exports = router;
