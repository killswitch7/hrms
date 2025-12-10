// backend/src/app.js
const express = require('express');
require('dotenv').config();

const connectDB = require('./config/db');
const authRoute = require('./routes/auth');
const adminRoute = require('./routes/admin');
const employeeRoute = require('./routes/employee');

const app = express();

// Connect DB
connectDB();

// Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// CORS for Angular at http://localhost:4200
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:4200');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});

// Body parser
app.use(express.json());

// Routes
app.use('/api/auth', authRoute);
app.use('/api/admin', adminRoute);
app.use('/api/employee', employeeRoute);

// Test route
app.get('/', (req, res) => {
  res.send('HRMS Backend is running');
});

// 404
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

module.exports = app;
