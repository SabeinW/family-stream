require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

const authRoutes = require('./routes/auth.routes');
const profileRoutes = require('./routes/profile.routes');
const mediaRoutes = require('./routes/media.routes');
const streamRoutes = require('./routes/stream.routes');
const friendsRoutes = require('./routes/friends.routes');

const app = express();
const PORT = process.env.PORT || 4000;

// Ensure upload directories exist on first run.
['originals', 'transcoded', 'thumbnails', 'avatars'].forEach((dir) => {
  const full = path.join(__dirname, 'uploads', dir);
  fs.mkdirSync(full, { recursive: true });
});

app.use(
  helmet({
    crossOriginResourcePolicy: false, // allow <video>/<img> to load cross-origin from the frontend dev server
  })
);
app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*' }));
app.use(morgan('dev'));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true, service: 'familystream-api' }));

app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/stream', streamRoutes);
app.use('/api/friends', friendsRoutes);

// Centralized error handler (e.g. Multer file-too-large errors)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Something went wrong.' });
});

app.listen(PORT, () => {
  console.log(`FamilyStream API running on http://localhost:${PORT}`);
});
