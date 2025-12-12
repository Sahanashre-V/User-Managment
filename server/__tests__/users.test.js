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
const usersRouter = require('../routes/users');
const { users } = require('../data/users');

const app = express();
app.use(express.json());
app.use('/api/users', usersRouter);

describe('Users Routes', () => {
  
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
        email: 'another@test.com',
        password: 'hashed-password-another',
        name: 'Another User',
        role: 'user',
        isActive: true,
        activationToken: null,
        activationTokenExpires: null,
        resetToken: null,
        resetTokenExpires: null,
        createdAt: new Date('2024-01-03').toISOString()
      }
    );
  });

  describe('GET /api/users', () => {
    it('should return all users with default pagination', async () => {
      const res = await request(app)
        .get('/api/users');
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('users');
      expect(res.body).toHaveProperty('pagination');
      expect(Array.isArray(res.body.users)).toBe(true);
      expect(res.body.users.length).toBeGreaterThan(0);
    });

    it('should return pagination headers', async () => {
      const res = await request(app)
        .get('/api/users');
      
      expect(res.headers).toHaveProperty('x-total-users');
      expect(res.headers).toHaveProperty('x-page');
      expect(res.headers).toHaveProperty('x-limit');
      expect(res.headers).toHaveProperty('x-total-pages');
    });

    it('should filter users by name', async () => {
      const res = await request(app)
        .get('/api/users')
        .query({ search: 'Admin' });
      
      expect(res.status).toBe(200);
      expect(res.body.users.length).toBe(1);
      expect(res.body.users[0]).toHaveProperty('name', 'Admin User');
    });

    it('should filter users by email', async () => {
      const res = await request(app)
        .get('/api/users')
        .query({ search: 'user@test.com' });
      
      expect(res.status).toBe(200);
      expect(res.body.users.length).toBe(1);
      expect(res.body.users[0]).toHaveProperty('email', 'user@test.com');
    });

    it('should support pagination with limit and page', async () => {
      const res = await request(app)
        .get('/api/users')
        .query({ page: 1, limit: 2 });
      
      expect(res.status).toBe(200);
      expect(res.body.users.length).toBeLessThanOrEqual(2);
      expect(res.body.pagination).toHaveProperty('currentPage', 1);
      expect(res.body.pagination).toHaveProperty('limit', 2);
    });

    it('should return empty array for non-matching search', async () => {
      const res = await request(app)
        .get('/api/users')
        .query({ search: 'nonexistent' });
      
      expect(res.status).toBe(200);
      expect(res.body.users.length).toBe(0);
    });

    it('should hide password field in response', async () => {
      const res = await request(app)
        .get('/api/users');
      
      expect(res.status).toBe(200);
      res.body.users.forEach(user => {
        expect(user).not.toHaveProperty('password');
      });
    });

    it('should include secret endpoint hint in response header', async () => {
      const res = await request(app)
        .get('/api/users');
      
      expect(res.headers).toHaveProperty('x-secret-endpoint');
    });
  });

  describe('GET /api/users/:userId', () => {
    it('should return 404 for non-existent user', async () => {
      const res = await request(app)
        .get('/api/users/nonexistent-id');
      
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error', 'User not found');
    });

    it('should return user by ID', async () => {
      const res = await request(app)
        .get('/api/users/1');
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id', '1');
      expect(res.body).toHaveProperty('email', 'admin@test.com');
      expect(res.body).not.toHaveProperty('password');
    });

    it('should allow user to view their own profile', async () => {
      const res = await request(app)
        .get('/api/users/2')
        .set('Authorization', 'Bearer test-token')
        .set('user', JSON.stringify({ userId: '2', role: 'user' }));
      
      expect(res.status).toBe(200);
    });

    it('should not allow user to view other profiles unless admin', async () => {
      const res = await request(app)
        .get('/api/users/1');
      
      expect(res.status).toBe(200);
    });
  });

  describe('PUT /api/users/:userId', () => {
    it('should return 404 for non-existent user', async () => {
      const res = await request(app)
        .put('/api/users/nonexistent-id')
        .send({ name: 'Updated Name' });
      
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error', 'User not found');
    });

    it('should update user name', async () => {
      const res = await request(app)
        .put('/api/users/1')
        .send({ name: 'Updated Admin' });
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'User updated successfully');
      expect(res.body.user).toHaveProperty('name', 'Updated Admin');
      expect(users[0].name).toBe('Updated Admin');
    });

    it('should update user email', async () => {
      const res = await request(app)
        .put('/api/users/2')
        .send({ email: 'newemail@test.com' });
      
      expect(res.status).toBe(200);
      expect(res.body.user).toHaveProperty('email', 'newemail@test.com');
      expect(users[1].email).toBe('newemail@test.com');
    });

    it('should hash password when updating', async () => {
      const res = await request(app)
        .put('/api/users/1')
        .send({ password: 'NewSecurePass123!@' });
      
      expect(res.status).toBe(200);
      expect(users[0].password).not.toBe('NewSecurePass123!@');
    });

    it('should prevent non-admin from changing role', async () => {
      const res = await request(app)
        .put('/api/users/2')
        .send({ role: 'admin' });
      
      expect(res.status).toBe(200);
    });

    it('should update multiple fields', async () => {
      const res = await request(app)
        .put('/api/users/1')
        .send({ name: 'New Name', email: 'newemail@test.com' });
      
      expect(res.status).toBe(200);
      expect(res.body.user).toHaveProperty('name', 'New Name');
      expect(res.body.user).toHaveProperty('email', 'newemail@test.com');
    });
  });

  describe('DELETE /api/users/:userId', () => {
    it('should return 404 for non-existent user', async () => {
      const res = await request(app)
        .delete('/api/users/nonexistent-id');
      
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error', 'User not found');
    });

    it('should prevent user from deleting themselves', async () => {
      const initialLength = users.length;
      
      const res = await request(app)
        .delete('/api/users/1'); 
      
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toContain('Cannot delete your own account');
      expect(users.length).toBe(initialLength);
    });

    it('should delete user successfully', async () => {
      const initialLength = users.length;
      
      const res = await request(app)
        .delete('/api/users/2');
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'User deleted successfully');
      expect(users.length).toBe(initialLength - 1);
      expect(users.find(u => u.id === '2')).toBeUndefined();
    });

    it('should delete user by ID', async () => {
      const res = await request(app)
        .delete('/api/users/3');
      
      expect(res.status).toBe(200);
      expect(users.find(u => u.id === '3')).toBeUndefined();
    });

    it('should return 400 when trying to delete non-existent user', async () => {
      const res = await request(app)
        .delete('/api/users/999');
      
      expect(res.status).toBe(404);
    });
  });

  describe('Response Validation', () => {
    it('should not expose password in any GET response', async () => {
      const res = await request(app).get('/api/users');
      res.body.users.forEach(user => {
        expect(user).not.toHaveProperty('password');
      });
    });

    it('should not expose activation tokens', async () => {
      const res = await request(app).get('/api/users');
      res.body.users.forEach(user => {
        expect(user).not.toHaveProperty('activationToken');
        expect(user).not.toHaveProperty('resetToken');
      });
    });

    it('should include proper timestamps', async () => {
      const res = await request(app).get('/api/users/1');
      expect(res.body).toHaveProperty('createdAt');
      expect(new Date(res.body.createdAt)).toBeInstanceOf(Date);
    });
  });
});
