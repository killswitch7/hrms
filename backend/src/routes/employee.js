// backend/src/routes/employee.js
const express = require('express');
const auth = require('../middlewares/auth');

const router = express.Router();

// Example protected route: only employee can access
router.get('/dashboard', auth, (req, res) => {
  if (req.user.role !== 'employee') {
    return res.status(403).json({ message: 'Forbidden: Employees only' });
  }

  res.json({
    message: 'Welcome to the employee dashboard',
    user: req.user,
  });
});

module.exports = router;
