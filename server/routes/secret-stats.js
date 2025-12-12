// SECRET ENDPOINT - Part of the assessment puzzle

const express = require('express');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { users } = require('../data/users');

const router = express.Router();

// Encoded secret message (Base64)
const SECRET_MESSAGE =
  'Q29uZ3JhdHVsYXRpb25zISBZb3UgZm91bmQgdGhlIHNlY3JldCBlbmRwb2ludC4gVGhlIGZpbmFsIGNsdWUgaXM6IFNIQ19IZWFkZXJfUHV6emxlXzIwMjQ=';

// Admin access given
router.get('/', requireAuth, requireAdmin, async (req, res) => {
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

  const adminCount = users.filter(u => u.role === 'admin').length;
  const userCount = users.filter(u => u.role === 'user').length;

    const stats = {
      totalUsers: adminCount + userCount,
      adminUsers: adminCount,
      regularUsers: userCount,
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
