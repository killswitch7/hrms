// backend/src/routes/auth.js
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');          // 👈 make sure path & file name are EXACT
const authMiddleware = require('../middlewares/auth');

const router = express.Router();

function generateToken(user) {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    }
  );
}

// DEBUG VERSION OF REGISTER
// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    console.log('▶️ /api/auth/register body:', req.body);

    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = new User({ email, password, role });  // 👈 will hash password via pre('save')
    await user.save();

    const token = generateToken(user);

    return res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('❌ Register error:', err);

    // ⛔️ TEMP: send full error so we can see what’s wrong
    return res.status(500).json({
      message: 'Server error',
      error: err.message,
      stack: err.stack,
    });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    console.log('▶️ /api/auth/login body:', req.body);

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user);

    return res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('❌ Login error:', err);
    return res.status(500).json({
      message: 'Server error',
      error: err.message,
      stack: err.stack,
    });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    return res.json({ user });
  } catch (err) {
    console.error('❌ Me error:', err);
    return res.status(500).json({
      message: 'Server error',
      error: err.message,
      stack: err.stack,
    });
  }
});

module.exports = router;
