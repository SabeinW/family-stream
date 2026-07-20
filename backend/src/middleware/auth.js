const jwt = require('jsonwebtoken');

/**
 * Verifies the "Authorization: Bearer <token>" header issued at login.
 * Attaches { userId, email } to req.user.
 */
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Missing authentication token.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { userId: payload.userId, email: payload.email };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

/**
 * Same as requireAuth, but also accepts the account JWT as a `?token=` query
 * param, not just the Authorization header. Needed for routes loaded via
 * <img>/<video> src (e.g. a profile's uploaded avatar photo), which can't
 * set custom headers — mirrors the existing header-or-query pattern already
 * used for the profile token below.
 */
function requireAuthFlexible(req, res, next) {
  const header = req.headers.authorization || '';
  const token = (header.startsWith('Bearer ') ? header.slice(7) : null) || req.query.token;

  if (!token) {
    return res.status(401).json({ error: 'Missing authentication token.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { userId: payload.userId, email: payload.email };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

/**
 * Verifies the short-lived "profile token" issued after "Who's watching?"
 * selection. Attaches req.profile = { profileId, userId }.
 * Some routes (e.g. stream) accept the profile token as a query param
 * since <video> tags can't set custom headers.
 */
function requireProfile(req, res, next) {
  const header = req.headers['x-profile-token'] || req.query.profileToken;
  if (!header) {
    return res.status(401).json({ error: 'No profile selected.' });
  }
  try {
    const payload = jwt.verify(header, process.env.JWT_SECRET);
    req.profile = { profileId: payload.profileId, userId: payload.userId };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired profile token.' });
  }
}

module.exports = { requireAuth, requireAuthFlexible, requireProfile };
