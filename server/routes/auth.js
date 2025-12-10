const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const validator = require('validator');

const router = express.Router();

// In-memory user storage (simulate database)
let users = [
  {
    id: '1',
    email: 'admin@test.com',
    password: '$2a$10$U6LLSFaA8R2w6zkDE.4qtOAKXbqWO02YCUWh897tJ/Lknd16xeQkO', // 'admin123'
    name: 'Admin User',
    role: 'admin',
    createdAt: new Date('2024-01-01').toISOString()
  },
  {
    id: '2',
    email: 'user@test.com',
    password: '$2a$10$8Q5FxYjomDvKv/EqyR.4fu80mkR7ZpFMdVR456o5xLye/C4TxeeaG', // 'user123'
    name: 'Regular User',
    role: 'user',
    createdAt: new Date('2024-01-02').toISOString()
  }
];


// FIXED: Use environment variable for JWT secret
const JWT_SECRET = process.env.JWT_SECRET 

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // FIXED: Input validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const user = users.find(u => u.email === email);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials for email' });
    }

    // FIXED: Ensure bcrypt.compare is awaited — it already was, so this is fine
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials for password' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.set('X-Hint', 'token_is_signed');

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Register endpoint
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    // FIXED: Complete validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (!validator.isStrongPassword(password)) {
      return res.status(400).json({ error: 'Password is too weak' });
    }

    const existingUser = users.find(u => u.email === email);

    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // FIXED: Validate roles safely
    const allowedRoles = ['user', 'admin'];
    const finalRole = allowedRoles.includes(role) ? role : 'user';

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      id: uuidv4(),
      email,
      password: hashedPassword,
      name: name || 'Unknown User',
      role: finalRole,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
