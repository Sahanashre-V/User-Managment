const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const validator = require('validator');
const { users } = require('../data/users');
const { sendActivationEmail, sendPasswordResetEmail } = require('../utils/email-service');

const router = express.Router();

// FIXED: Use environment variable for JWT secret
const JWT_SECRET = process.env.JWT_SECRET;

// Generate secure tokens
function generateSecureToken() {
  return crypto.randomBytes(32).toString('hex');
}

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

    // Check if account is activated
    if (user.isActive === false) {
      return res.status(403).json({ 
        error: 'Account not activated. Please check your email for the activation link.',
        needsActivation: true
      });
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

    // Generate activation token
    const activationToken = generateSecureToken();
    const activationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const newUser = {
      id: uuidv4(),
      email,
      password: hashedPassword,
      name: name || 'Unknown User',
      role: finalRole,
      isActive: false,
      activationToken,
      activationTokenExpires: activationTokenExpires.toISOString(),
      resetToken: null,
      resetTokenExpires: null,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);

    // Send activation email via Brevo SMTP
    const activationLink = `http://localhost:8888/api/auth/activate/${activationToken}`;
    await sendActivationEmail(email, newUser.name, activationLink);

    res.status(201).json({
      message: 'User created successfully. Please check your email to activate your account.',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        isActive: newUser.isActive
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Account Activation Endpoint
router.get('/activate/:token', async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ error: 'Activation token is required' });
    }

    const user = users.find(u => u.activationToken === token);

    if (!user) {
      return res.status(400).json({ error: 'Invalid activation token' });
    }

    if (new Date() > new Date(user.activationTokenExpires)) {
      return res.status(400).json({ error: 'Activation token has expired. Please request a new one.' });
    }

    user.isActive = true;
    user.activationToken = null;
    user.activationTokenExpires = null;

    res.json({
      message: 'Account activated successfully. You can now log in.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Request Password Reset Endpoint
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const user = users.find(u => u.email === email);

    // Always return success to prevent email enumeration
    const successMessage = 'If the email exists, a password reset link will be sent.';

    if (!user) {
      return res.json({ message: successMessage });
    }

    // Generate 6-digit secure reset code
    const resetCode = crypto.randomInt(100000, 999999).toString();
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.resetToken = resetCode;
    user.resetTokenExpires = resetTokenExpires.toISOString();

    // Send password reset email via Brevo SMTP
    await sendPasswordResetEmail(email, user.name, resetCode);

    res.json({
      message: successMessage
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reset Password Endpoint (POST with code in body)
router.post('/reset-password', async (req, res) => {
  try {
    const { code, password, confirmPassword } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Reset code is required' });
    }

    if (!password) {
      return res.status(400).json({ error: 'New password is required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    if (!validator.isStrongPassword(password)) {
      return res.status(400).json({ 
        error: 'Password is too weak. Must contain at least 8 characters, including uppercase, lowercase, number, and special character.' 
      });
    }

    const user = users.find(u => u.resetToken === code);

    if (!user) {
      return res.status(400).json({ error: 'Invalid reset code' });
    }

    if (new Date() > new Date(user.resetTokenExpires)) {
      return res.status(400).json({ error: 'Reset code has expired. Please request a new one.' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user's password and clear reset token
    user.password = hashedPassword;
    user.resetToken = null;
    user.resetTokenExpires = null;


    res.json({
      message: 'Password has been reset successfully. You can now log in with your new password.'
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
