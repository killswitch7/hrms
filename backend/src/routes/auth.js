// backend/src/routes/auth.js
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Employee = require('../models/Employee');
const { OTP_REQUIRED_EMAIL } = require('../config/mail');
const { createAndSendOtp, verifyOtp } = require('../services/otpService');

const router = express.Router();

/**
 * POST /api/auth/register
 * Use this mainly to create the first admin (via Postman)
 * Body: { name, email, password, role? }
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: 'Name, email and password are required.' });
    }

    const normalizedEmail = email.toLowerCase();

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ message: 'User already exists' });
    }

    const user = new User({
      name,
      email: normalizedEmail,
      password,           // will be hashed in pre-save hook
      role: role || 'admin',
    });

    await user.save();

    return res.status(201).json({
      message: 'User registered',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: 'Email and password are required.' });
    }

    const normalizedEmail = email.toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Block login for inactive employee/manager profile.
    // If admin switches status back to active, login works again.
    if (user.role === 'employee' || user.role === 'manager') {
      const employeeProfile = await Employee.findOne({ user: user._id }).select('status');
      if (employeeProfile && employeeProfile.status === 'inactive') {
        return res.status(403).json({
          message: 'Your account is inactive. Please contact admin.',
        });
      }
    }

    // Login OTP check only for configured email.
    if (normalizedEmail === OTP_REQUIRED_EMAIL) {
      await createAndSendOtp({
        email: normalizedEmail,
        userId: user._id,
        purpose: 'login',
        minutes: 10,
      });

      const tempToken = jwt.sign(
        { id: user._id, role: user.role, email: user.email, purpose: 'login_otp' },
        process.env.JWT_SECRET || 'secret123',
        { expiresIn: '10m' }
      );

      return res.json({
        message: 'OTP sent to email. Please verify OTP to login.',
        requiresOtp: true,
        email: normalizedEmail,
        tempToken,
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      process.env.JWT_SECRET || 'secret123',
      { expiresIn: '8h' }
    );

    const userSafe = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    return res.json({
      message: 'Login successful',
      token,
      requiresOtp: false,
      user: userSafe,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * POST /api/auth/verify-login-otp
 * Body: { email, otp, tempToken }
 */
router.post('/verify-login-otp', async (req, res) => {
  try {
    const { email, otp, tempToken } = req.body;
    if (!email || !otp || !tempToken) {
      return res.status(400).json({ message: 'Email, OTP and temp token are required.' });
    }

    const normalizedEmail = String(email).toLowerCase();
    if (normalizedEmail !== OTP_REQUIRED_EMAIL) {
      return res.status(400).json({ message: 'OTP login is not enabled for this email.' });
    }

    const decoded = jwt.verify(tempToken, process.env.JWT_SECRET || 'secret123');
    if (decoded?.purpose !== 'login_otp' || String(decoded?.email || '').toLowerCase() !== normalizedEmail) {
      return res.status(400).json({ message: 'Invalid or expired login session.' });
    }

    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const isValidOtp = await verifyOtp({
      email: normalizedEmail,
      purpose: 'login',
      code: otp,
    });
    if (!isValidOtp) {
      return res.status(400).json({ message: 'Invalid or expired OTP.' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      process.env.JWT_SECRET || 'secret123',
      { expiresIn: '8h' }
    );

    return res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('verify-login-otp error:', err);
    return res.status(400).json({ message: 'Invalid or expired OTP session.' });
  }
});

/**
 * POST /api/auth/request-login-otp
 * Body: { email, tempToken }
 * Allows resend OTP on login page.
 */
router.post('/request-login-otp', async (req, res) => {
  try {
    const { email, tempToken } = req.body;
    if (!email || !tempToken) {
      return res.status(400).json({ message: 'Email and temp token are required.' });
    }

    const normalizedEmail = String(email).toLowerCase();
    if (normalizedEmail !== OTP_REQUIRED_EMAIL) {
      return res.status(400).json({ message: 'OTP login is not enabled for this email.' });
    }

    const decoded = jwt.verify(tempToken, process.env.JWT_SECRET || 'secret123');
    if (decoded?.purpose !== 'login_otp' || String(decoded?.email || '').toLowerCase() !== normalizedEmail) {
      return res.status(400).json({ message: 'Invalid login session.' });
    }

    await createAndSendOtp({
      email: normalizedEmail,
      userId: decoded.id,
      purpose: 'login',
      minutes: 10,
    });

    return res.json({ message: 'OTP sent again to email.' });
  } catch (err) {
    console.error('request-login-otp error:', err);
    return res.status(400).json({ message: 'Could not resend OTP.' });
  }
});

/**
 * POST /api/auth/forgot-password/request-otp
 * Body: { email }
 */
router.post('/forgot-password/request-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required.' });

    const normalizedEmail = String(email).toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).select('_id email');

    // Keep message generic for safety
    if (!user) {
      return res.json({ message: 'If this email exists, OTP has been sent.' });
    }

    await createAndSendOtp({
      email: normalizedEmail,
      userId: user._id,
      purpose: 'forgot_password',
      minutes: 10,
    });

    return res.json({ message: 'If this email exists, OTP has been sent.' });
  } catch (err) {
    console.error('forgot-password/request-otp error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * POST /api/auth/forgot-password/reset
 * Body: { email, otp, newPassword }
 */
router.post('/forgot-password/reset', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Email, OTP and new password are required.' });
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters.' });
    }

    const normalizedEmail = String(email).toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return res.status(400).json({ message: 'Invalid email or OTP.' });

    const otpOk = await verifyOtp({
      email: normalizedEmail,
      purpose: 'forgot_password',
      code: otp,
    });
    if (!otpOk) {
      return res.status(400).json({ message: 'Invalid or expired OTP.' });
    }

    user.password = String(newPassword);
    await user.save();

    return res.json({ message: 'Password reset successful. Please login.' });
  } catch (err) {
    console.error('forgot-password/reset error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
