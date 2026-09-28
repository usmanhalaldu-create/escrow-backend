// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Handle multiple JWT payload shapes — different signers put the
    // user ID under different keys. Try every common one.
    req.userId = decoded.userId || decoded.sub || decoded.id;
    req.isAdmin =
      decoded.isAdmin === true ||
      (Array.isArray(decoded.roles) && decoded.roles.includes('ADMIN'));

    if (!req.userId) {
      console.error('Token has no user ID field:', decoded);
      return res.status(401).json({ error: 'Invalid token: missing user ID' });
    }

    next();
  } catch (err) {
    console.error('Auth middleware error:', err.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireAdmin(req, res, next) {
  if (!req.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

function signToken(userId, isAdmin) {
  // Sign BOTH `sub` (standard JWT claim) and `userId` (legacy) so
  // every version of the middleware can read it.
  return jwt.sign(
    { userId, sub: userId, isAdmin },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

module.exports = { requireAuth, requireAdmin, signToken };
