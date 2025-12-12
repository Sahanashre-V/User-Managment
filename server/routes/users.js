const express = require('express');
const bcrypt = require('bcryptjs');
const { users } = require('../data/users');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET ALL USERS (with search and pagination)
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { search } = req.query;
    
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    let filteredUsers = [...users];

    // search (searches in name and email)
    if (search) {
      const searchLower = search.toLowerCase();
      filteredUsers = filteredUsers.filter(user =>
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower)
      );
    }

    // Apply pagination
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedUsers = filteredUsers.slice(start, end);

    res.set({
      'X-Total-Users': filteredUsers.length.toString(),
      'X-Page': page.toString(),
      'X-Limit': limit.toString(),
      'X-Total-Pages': Math.ceil(filteredUsers.length / limit).toString(),
      'X-Secret-Endpoint': '/api/users/secret-stats'
    });

    res.json({
      users: paginatedUsers.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt
      })),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(filteredUsers.length / limit),
        totalUsers: filteredUsers.length,
        limit: limit
      }
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET USER BY ID
router.get('/:userId', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user.role !== "admin" && req.user.userId !== userId) {
      return res.status(403).json({ error: "Access denied. You can only view your own profile." });
    }

    const user = users.find(u => u.id === userId);
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

    // Prevent any user from deleting themselves (security measure)
    if (req.user.userId === userId) {
      return res.status(400).json({ 
        error: "Cannot delete your own account",
        message: "Self-deletion is not allowed. Contact another admin."
      });
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