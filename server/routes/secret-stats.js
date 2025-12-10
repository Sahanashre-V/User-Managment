// SECRET ENDPOINT - Part of the assessment puzzle
// This endpoint should be discovered by reading the hints

const express = require('express');
const jwt = require('jsonwebtoken');

const router = express.Router();

// FIXED: Do NOT hard-code secrets
const JWT_SECRET = process.env.JWT_SECRET 

// Encoded secret message (Base64)
const SECRET_MESSAGE =
  'Q29uZ3JhdHVsYXRpb25zISBZb3UgZm91bmQgdGhlIHNlY3JldCBlbmRwb2ludC4gVGhlIGZpbmFsIGNsdWUgaXM6IFNIQ19IZWFkZXJfUHV6emxlXzIwMjQ=';

// Authentication middleware (fix for missing auth)
function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) {
    return res.status(401).json({ error: 'Missing Authorization header' });
  }

  const token = auth.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Secret stats endpoint
router.get('/', requireAuth, async (req, res) => {
  try {
    const secretHeader = req.get('x-secret-challenge');
    const querySecret = req.query.secret;

    // PUZZLE hint logic preserved
    if (
      secretHeader !== 'find_me_if_you_can_2024' &&
      querySecret !== 'admin_override'
    ) {
      return res.status(403).json({
        error: 'Access denied',
        hint: 'Check the network headers or try a query parameter'
      });
    }

    const stats = {
      totalUsers: 2,
      adminUsers: 1,
      regularUsers: 1,
      systemInfo: {
        nodeVersion: process.version,
        platform: process.platform,
        uptime: process.uptime()
      },
      secretMessage: Buffer.from(SECRET_MESSAGE, 'base64').toString('utf-8'),
      timestamp: new Date().toISOString()
    };

    res.set({
      'X-Puzzle-Complete': 'true',
      'X-Next-Challenge': 'Find all the bugs in the authentication system',
      'Cache-Control': 'no-cache'
    });

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
