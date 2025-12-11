const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { users } = require('../data/users');

const router = express.Router();

// Use environment secret
const JWT_SECRET = process.env.JWT_SECRET;

function verifyToken(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: "Missing token" });

  const token = header.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

function requireAdmin(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

const requireAuth = verifyToken;

// GET ALL USERS
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    // Pagination
    // const searchByName = 
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const start = (page - 1) * limit;
    const end = start + limit;

    const paginatedUsers = users.slice(start, end);

    res.set({
      'X-Total-Users': users.length.toString(),
      'X-Page': page.toString(),
      'X-Limit': limit.toString(),
      'X-Secret-Endpoint': '/api/users/secret-stats'
    });

    res.json({
      users: paginatedUsers.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt
      }))
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET USER BY ID
router.get('/:userId', requireAuth, async (req, res) => {
  try {
    const user = users.find(u => u.id === req.params.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// UPDATE USER
router.put('/:userId', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;

    // Allow: admin edits anyone OR user edits themselves
    if (req.user.role !== "admin" && req.user.userId !== userId) {
      return res.status(403).json({ error: "Not allowed" });
    }

    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) return res.status(404).json({ error: "User not found" });

    const updateData = { ...req.body };

    // Hash password if updating
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    // Only admin can change roles
    if (updateData.role && req.user.role !== "admin") {
      return res.status(403).json({ error: "Only admins can change roles" });
    }

    users[userIndex] = { ...users[userIndex], ...updateData };

    res.json({
      message: "User updated successfully",
      user: {
        id: users[userIndex].id,
        email: users[userIndex].email,
        name: users[userIndex].name,
        role: users[userIndex].role,
        createdAt: users[userIndex].createdAt
      }
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE USER
router.delete('/:userId', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    // Prevent admin from deleting themselves
    if (req.user.userId === userId) {
      return res.status(400).json({ error: "Cannot delete your own account" });
    }

    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) return res.status(404).json({ error: "User not found" });

    users.splice(userIndex, 1);

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;