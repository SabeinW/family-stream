const express = require('express');
const fs = require('fs');
const path = require('path');
const prisma = require('../utils/prisma');
const { requireProfile } = require('../middleware/auth');
const { canAccessMedia } = require('../utils/access');

const router = express.Router();

const TRANSCODED = path.join(__dirname, '..', 'uploads', 'transcoded');
const ORIGINALS = path.join(__dirname, '..', 'uploads', 'originals');
const THUMBS = path.join(__dirname, '..', 'uploads', 'thumbnails');

/**
 * GET /api/stream/:id?profileToken=...&quality=720p
 * Streams a transcoded video in chunks using HTTP 206 Partial Content so
 * playback starts instantly and supports seeking, instead of buffering the
 * whole file. <video> tags can't set an Authorization header, so this route
 * accepts the profile token as a query string param instead.
 *
 * `quality` selects a specific rendition (1080p/720p/480p) from the ladder
 * generated at upload time; omitted or unmatched falls back to the default
 * (highest-quality) stream so old media without renditions still plays.
 */
router.get('/:id', requireProfile, async (req, res) => {
  const media = await prisma.media.findUnique({
    where: { id: req.params.id },
    include: { renditions: true },
  });
  if (!media || media.type !== 'video' || media.status !== 'ready') {
    return res.status(404).json({ error: 'Video not available.' });
  }
  if (!(await canAccessMedia(req.profile.userId, media))) {
    return res.status(404).json({ error: 'Video not available.' });
  }

  const requestedQuality = req.query.quality;
  const rendition = requestedQuality && media.renditions.find((r) => r.quality === requestedQuality);
  const filename = rendition ? rendition.path : media.streamPath;

  const filePath = path.join(TRANSCODED, filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File missing on disk.' });

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (!range) {
    // No range requested: send the whole thing (rare — most browsers send Range).
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
      'Accept-Ranges': 'bytes',
    });
    return fs.createReadStream(filePath).pipe(res);
  }

  const parts = range.replace(/bytes=/, '').split('-');
  const start = parseInt(parts[0], 10);
  const end = parts[1] ? parseInt(parts[1], 10) : Math.min(start + 5 * 1024 * 1024, fileSize - 1); // 5MB chunks
  const chunkSize = end - start + 1;

  res.writeHead(206, {
    'Content-Range': `bytes ${start}-${end}/${fileSize}`,
    'Accept-Ranges': 'bytes',
    'Content-Length': chunkSize,
    'Content-Type': 'video/mp4',
    'Cache-Control': 'public, max-age=31536000, immutable',
  });

  fs.createReadStream(filePath, { start, end }).pipe(res);
});

// GET /api/stream/photo/:id — full-resolution photo
router.get('/photo/:id', requireProfile, async (req, res) => {
  const media = await prisma.media.findUnique({ where: { id: req.params.id } });
  if (!media || media.type !== 'photo') return res.status(404).end();
  if (!(await canAccessMedia(req.profile.userId, media))) return res.status(404).end();
  const filePath = path.join(ORIGINALS, media.originalPath);
  if (!fs.existsSync(filePath)) return res.status(404).end();
  res.sendFile(filePath);
});

// GET /api/stream/download/:id — original-quality file (pre-transcode for
// videos, full-resolution for photos), forced as a browser download via
// Content-Disposition rather than inline playback/display. Available to
// anyone with view access, not just the owner — sharing a memory should
// mean the people it's shared with can actually keep a copy of it too.
router.get('/download/:id', requireProfile, async (req, res) => {
  const media = await prisma.media.findUnique({ where: { id: req.params.id } });
  if (!media || !(await canAccessMedia(req.profile.userId, media))) {
    return res.status(404).json({ error: 'Not found.' });
  }
  const filePath = path.join(ORIGINALS, media.originalPath);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File missing on disk.' });

  const ext = path.extname(media.originalPath);
  const safeName = media.title.replace(/[^a-z0-9 _.-]/gi, '_').trim() || 'download';
  res.download(filePath, `${safeName}${ext}`);
});

// GET /api/stream/thumbnail/:id — lightweight JPEG for cards/carousels.
// Uses the profile token like the other stream routes (the frontend already
// sends one via ?profileToken= for <img> tags), so thumbnails respect the
// same access rules as everything else instead of being world-readable.
router.get('/thumbnail/:id', requireProfile, async (req, res) => {
  const media = await prisma.media.findUnique({ where: { id: req.params.id } });
  if (!media || !media.thumbnailPath) return res.status(404).end();
  if (!(await canAccessMedia(req.profile.userId, media))) return res.status(404).end();
  const dir = media.type === 'video' ? THUMBS : ORIGINALS;
  const filePath = path.join(dir, media.thumbnailPath);
  if (!fs.existsSync(filePath)) return res.status(404).end();
  res.set('Cache-Control', 'public, max-age=86400');
  res.sendFile(filePath);
});

module.exports = router;
