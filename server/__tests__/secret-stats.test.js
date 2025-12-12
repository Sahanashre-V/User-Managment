jest.mock('../middleware/auth', () => ({
  requireAuth: (req, res, next) => {
    req.user = req.user || { userId: '1', email: 'admin@test.com', role: 'admin' };
    next();
  },
  requireAdmin: (req, res, next) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  }
}));

const express = require('express');
const request = require('supertest');
const secretStatsRouter = require('../routes/secret-stats');
const { users } = require('../data/users');

const app = express();
app.use(express.json());
app.use('/api/users/secret-stats', secretStatsRouter);

describe('Secret Stats Routes', () => {

  beforeEach(() => {
    // Reset users to initial state
    users.length = 0;
    users.push(
      {
        id: '1',
        email: 'admin@test.com',
        password: 'hashed-password-admin',
        name: 'Admin User',
        role: 'admin',
        isActive: true,
        activationToken: null,
        activationTokenExpires: null,
        resetToken: null,
        resetTokenExpires: null,
        createdAt: new Date('2024-01-01').toISOString()
      },
      {
        id: '2',
        email: 'user@test.com',
        password: 'hashed-password-user',
        name: 'Regular User',
        role: 'user',
        isActive: true,
        activationToken: null,
        activationTokenExpires: null,
        resetToken: null,
        resetTokenExpires: null,
        createdAt: new Date('2024-01-02').toISOString()
      },
      {
        id: '3',
        email: 'admin2@test.com',
        password: 'hashed-password-admin2',
        name: 'Second Admin',
        role: 'admin',
        isActive: true,
        activationToken: null,
        activationTokenExpires: null,
        resetToken: null,
        resetTokenExpires: null,
        createdAt: new Date('2024-01-03').toISOString()
      }
    );
  });

  describe('GET /api/users/secret-stats', () => {
    it('should return 403 when no header or query secret provided', async () => {
      const res = await request(app)
        .get('/api/users/secret-stats');
      
      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty('error', 'Access denied');
      expect(res.body).toHaveProperty('hint');
    });

    it('should return 200 with valid x-secret-challenge header', async () => {
      const res = await request(app)
        .get('/api/users/secret-stats')
        .set('x-secret-challenge', 'find_me_if_you_can_2024');
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('totalUsers');
      expect(res.body).toHaveProperty('adminUsers');
      expect(res.body).toHaveProperty('regularUsers');
      expect(res.body).toHaveProperty('secretMessage');
      expect(res.body).toHaveProperty('timestamp');
    });

    it('should return 200 with valid admin_override query parameter', async () => {
      const res = await request(app)
        .get('/api/users/secret-stats')
        .query({ secret: 'admin_override' });
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('totalUsers');
    });

    it('should return 403 with invalid header', async () => {
      const res = await request(app)
        .get('/api/users/secret-stats')
        .set('x-secret-challenge', 'wrong-header');
      
      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty('error', 'Access denied');
    });

    it('should return 403 with invalid query parameter', async () => {
      const res = await request(app)
        .get('/api/users/secret-stats')
        .query({ secret: 'wrong-secret' });
      
      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty('error', 'Access denied');
    });

    it('should return correct user count', async () => {
      const res = await request(app)
        .get('/api/users/secret-stats')
        .set('x-secret-challenge', 'find_me_if_you_can_2024');
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('totalUsers', 3);
      expect(res.body).toHaveProperty('adminUsers', 2);
      expect(res.body).toHaveProperty('regularUsers', 1);
    });

    it('should include system information', async () => {
      const res = await request(app)
        .get('/api/users/secret-stats')
        .set('x-secret-challenge', 'find_me_if_you_can_2024');
      
      expect(res.status).toBe(200);
      expect(res.body.systemInfo).toHaveProperty('nodeVersion');
      expect(res.body.systemInfo).toHaveProperty('platform');
      expect(res.body.systemInfo).toHaveProperty('uptime');
    });

    it('should decode and return secret message', async () => {
      const res = await request(app)
        .get('/api/users/secret-stats')
        .set('x-secret-challenge', 'find_me_if_you_can_2024');
      
      expect(res.status).toBe(200);
      expect(res.body.secretMessage).toContain('Congratulations');
      expect(res.body.secretMessage).toContain('secret endpoint');
    });

    it('should include proper response headers', async () => {
      const res = await request(app)
        .get('/api/users/secret-stats')
        .set('x-secret-challenge', 'find_me_if_you_can_2024');
      
      expect(res.status).toBe(200);
      expect(res.headers['x-puzzle-complete']).toBe('true');
      expect(res.headers['x-next-challenge']).toBeDefined();
      expect(res.headers['cache-control']).toBe('no-cache');
    });

    it('should include valid timestamp', async () => {
      const res = await request(app)
        .get('/api/users/secret-stats')
        .set('x-secret-challenge', 'find_me_if_you_can_2024');
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('timestamp');
      const timestamp = new Date(res.body.timestamp);
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('should allow either header OR query parameter (header takes precedence)', async () => {
      const res = await request(app)
        .get('/api/users/secret-stats')
        .set('x-secret-challenge', 'find_me_if_you_can_2024')
        .query({ secret: 'wrong' });
      
      expect(res.status).toBe(200);
    });

    it('should work with query parameter when header is missing', async () => {
      const res = await request(app)
        .get('/api/users/secret-stats')
        .query({ secret: 'admin_override' });
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('totalUsers', 3);
    });

    it('should count admin users correctly', async () => {
      users.push({
        id: '4',
        email: 'admin3@test.com',
        password: 'hashed',
        name: 'Third Admin',
        role: 'admin',
        isActive: true,
        activationToken: null,
        activationTokenExpires: null,
        resetToken: null,
        resetTokenExpires: null,
        createdAt: new Date().toISOString()
      });

      const res = await request(app)
        .get('/api/users/secret-stats')
        .set('x-secret-challenge', 'find_me_if_you_can_2024');
      
      expect(res.status).toBe(200);
      expect(res.body.adminUsers).toBe(3);
      expect(res.body.totalUsers).toBe(4);
    });

    it('should count regular users correctly', async () => {
      users.push({
        id: '4',
        email: 'user2@test.com',
        password: 'hashed',
        name: 'Second Regular',
        role: 'user',
        isActive: true,
        activationToken: null,
        activationTokenExpires: null,
        resetToken: null,
        resetTokenExpires: null,
        createdAt: new Date().toISOString()
      });

      const res = await request(app)
        .get('/api/users/secret-stats')
        .set('x-secret-challenge', 'find_me_if_you_can_2024');
      
      expect(res.status).toBe(200);
      expect(res.body.regularUsers).toBe(2);
      expect(res.body.totalUsers).toBe(4);
    });

    it('should return JSON response with proper content-type', async () => {
      const res = await request(app)
        .get('/api/users/secret-stats')
        .set('x-secret-challenge', 'find_me_if_you_can_2024');
      
      expect(res.status).toBe(200);
      expect(res.type).toMatch(/json/);
    });
  });
});
