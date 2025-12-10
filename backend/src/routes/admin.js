// backend/src/routes/admin.js
const express = require('express');
const auth = require('../middlewares/auth');

const router = express.Router();

// Example protected route: only admin can access
router.get('/dashboard', auth, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden: Admins only' });
  }

  res.json({
    message: 'Welcome to the admin dashboard',
    user: req.user,
  });
});

module.exports = router;
