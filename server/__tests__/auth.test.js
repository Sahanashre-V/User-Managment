jest.mock('../utils/email-service', () => ({
  sendActivationEmail: jest.fn().mockResolvedValue(true),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(true)
}));

jest.mock('../middleware/auth', () => ({
  requireAuth: (req, res, next) => {
    req.user = req.user || { userId: '1', email: 'admin@test.com', role: 'admin' };
    next();
  },
  requireAdmin: (req, res, next) => next()
}));

const express = require('express');
const request = require('supertest');
process.env.JWT_SECRET = 'test-secret-key-12345';
const authRouter = require('../routes/auth');
const { users } = require('../data/users');

const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);

process.env.JWT_SECRET = 'test-secret-key-12345';

describe('Auth Routes', () => {
  
  beforeEach(() => {
    users.length = 0;
    users.push(
      {
        id: '1',
        email: 'admin@test.com',
        password: '$2b$10$OMDtxVP.895X/kjWrx4ODevOvD7G5QZFJxdE3rkqYkEyU39xsU8T2', // password: Admin123!@
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
        password: '$2b$10$3fOf.Y32D3dYWn05eyHez.a2paGw6ioqPj1u.so7Wlnjn7ufvQJDe', // password: User123!@
        name: 'Regular User',
        role: 'user',
        isActive: true,
        activationToken: null,
        activationTokenExpires: null,
        resetToken: null,
        resetTokenExpires: null,
        createdAt: new Date('2024-01-02').toISOString()
      }
    );
  });

  describe('POST /api/auth/login', () => {
    it('should return 400 if email is missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ password: 'Test123!@' });
      
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'Email and password required');
    });

    it('should return 400 if password is missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'user@test.com' });
      
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'Email and password required');
    });

    it('should return 400 for invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'invalid-email', password: 'Test123!@' });
      
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'Invalid email format');
    });

    it('should return 401 if user not found', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nonexistent@test.com', password: 'Test123!@' });
      
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
    });

    it('should return 403 if account is not activated', async () => {
      users[0].isActive = false;
      
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@test.com', password: 'Admin123!@' });
      
      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty('needsActivation', true);
    });

    it('should return 401 for incorrect password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@test.com', password: 'WrongPassword123!@' });
      
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
    });

    it('should return 200 and token on successful login', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@test.com', password: 'Admin123!@' });
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'Login successful');
      expect(res.body).toHaveProperty('token');
      expect(res.body.token).toBeTruthy();
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user).toHaveProperty('email', 'admin@test.com');
      expect(res.body.user).toHaveProperty('role', 'admin');
    });
  });

  describe('POST /api/auth/register', () => {
    it('should return 400 if email is missing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ password: 'Test123!@' });
      
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'Email and password required');
    });

    it('should return 400 if password is missing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'newuser@test.com' });
      
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'Email and password required');
    });

    it('should return 400 for invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'invalid-email', password: 'Test123!@' });
      
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'Invalid email format');
    });

    it('should return 400 for weak password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'newuser@test.com', password: 'weak' });
      
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'Password is too weak');
    });

    it('should return 409 if user already exists', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'admin@test.com', password: 'Test123!@' });
      
      expect(res.status).toBe(409);
      expect(res.body).toHaveProperty('error', 'User already exists');
    });

    it('should create new user with status 201', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@test.com',
          password: 'SecurePass123!@',
          name: 'New User'
        });
      
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('message');
      expect(res.body.user).toHaveProperty('email', 'newuser@test.com');
      expect(res.body.user).toHaveProperty('isActive', false);
      expect(res.body.user).toHaveProperty('role', 'user');
    });

    it('should default to user role if not specified', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'user123@test.com',
          password: 'SecurePass123!@'
        });
      
      expect(res.status).toBe(201);
      expect(res.body.user).toHaveProperty('role', 'user');
    });
  });

  describe('GET /api/auth/activate/:token', () => {
    it('should return 400 if token is missing', async () => {
      const res = await request(app)
        .get('/api/auth/activate/');
      
      expect(res.status).toBe(404); 
    });

    it('should return 400 for invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/activate/invalid-token');
      
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'Invalid activation token');
    });

    it('should activate account with valid token', async () => {
      const activationToken = 'test-activation-token-12345';
      users[0].isActive = false;
      users[0].activationToken = activationToken;
      users[0].activationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      
      const res = await request(app)
        .get(`/api/auth/activate/${activationToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'Account activated successfully. You can now log in.');
      expect(res.body.user).toHaveProperty('isActive', true);
      expect(users[0].activationToken).toBe(null);
    });

    it('should return 400 for expired activation token', async () => {
      const activationToken = 'expired-token';
      users[0].isActive = false;
      users[0].activationToken = activationToken;
      users[0].activationTokenExpires = new Date(Date.now() - 1000).toISOString(); 
      
      const res = await request(app)
        .get(`/api/auth/activate/${activationToken}`);
      
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'Activation token has expired. Please request a new one.');
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('should return 400 if email is missing', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({});
      
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'Email is required');
    });

    it('should return 400 for invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'invalid-email' });
      
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'Invalid email format');
    });

    it('should return success message even if user not found (security)', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@test.com' });
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message');
    });

    it('should generate reset token for existing user', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'admin@test.com' });
      
      expect(res.status).toBe(200);
      expect(users[0].resetToken).toBeTruthy();
      expect(users[0].resetTokenExpires).toBeTruthy();
    });
  });

  describe('POST /api/auth/reset-password', () => {
    it('should return 400 if reset code is missing', async () => {
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ password: 'NewPass123!@', confirmPassword: 'NewPass123!@' });
      
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'Reset code is required');
    });

    it('should return 400 if password is missing', async () => {
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ code: '123456' });
      
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'New password is required');
    });

    it('should return 400 if passwords do not match', async () => {
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({
          code: '123456',
          password: 'NewPass123!@',
          confirmPassword: 'Different123!@'
        });
      
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'Passwords do not match');
    });

    it('should return 400 for weak password', async () => {
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({
          code: '123456',
          password: 'weak',
          confirmPassword: 'weak'
        });
      
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toContain('too weak');
    });

    it('should return 400 for invalid reset code', async () => {
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({
          code: 'invalid-code',
          password: 'NewPass123!@',
          confirmPassword: 'NewPass123!@'
        });
      
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'Invalid reset code');
    });

    it('should reset password with valid code', async () => {
      const resetCode = '123456';
      users[0].resetToken = resetCode;
      users[0].resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({
          code: resetCode,
          password: 'NewPass123!@',
          confirmPassword: 'NewPass123!@'
        });
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message');
      expect(users[0].resetToken).toBe(null);
      expect(users[0].resetTokenExpires).toBe(null);
    });

    it('should return 400 for expired reset code', async () => {
      const resetCode = 'expired-code';
      users[0].resetToken = resetCode;
      users[0].resetTokenExpires = new Date(Date.now() - 1000).toISOString();
      
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({
          code: resetCode,
          password: 'NewPass123!@',
          confirmPassword: 'NewPass123!@'
        });
      
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'Reset code has expired. Please request a new one.');
    });
  });

  describe('GET /api/auth/profile', () => {
    it('should return user profile', async () => {
      const res = await request(app)
        .get('/api/auth/profile');
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('email');
      expect(res.body).toHaveProperty('name');
      expect(res.body).toHaveProperty('role');
    });
  });

  describe('POST /api/auth/change-password', () => {
    it('should return 400 if oldPassword is missing', async () => {
      const res = await request(app)
        .post('/api/auth/change-password')
        .send({ newPassword: 'NewPass123!@' });
      
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('should return 400 if newPassword is missing', async () => {
      const res = await request(app)
        .post('/api/auth/change-password')
        .send({ oldPassword: 'Admin123!@' });
      
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });
});
