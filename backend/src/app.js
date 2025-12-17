// backend/src/app.js
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Route files
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const employeeRoutes = require('./routes/employee');

const app = express();

// ---------- CONNECT TO MONGODB ----------
connectDB();

// ---------- GLOBAL MIDDLEWARE ----------
app.use(
  cors({
    origin: 'http://localhost:4200', // your Angular frontend
    credentials: true,
  })
);

app.use(express.json()); // parse JSON body

// ---------- ROOT TEST ROUTE ----------
app.get('/', (req, res) => {
  res.send('HRMS backend is running');
});

// ---------- API ROUTES ----------
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/employee', employeeRoutes);

// ---------- 404 HANDLER ----------
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// ---------- ERROR HANDLER ----------
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res
    .status(err.status || 500)
    .json({ message: err.message || 'Server error' });
});

module.exports = app;
