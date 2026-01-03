// backend/src/app.js
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const authRoute = require('./routes/auth');
const adminRoute = require('./routes/admin');
const employeeRoute = require('./routes/employee');

const app = express();

// Connect DB
connectDB();

// Body parser
app.use(express.json());

// CORS
app.use(
  cors({
    origin: 'http://localhost:4200',
    credentials: true,
  })
);

// Routes
app.use('/api/auth', authRoute);
app.use('/api/admin', adminRoute);      // <-- IMPORTANT
app.use('/api/employee', employeeRoute);

// Test route
app.get('/', (req, res) => res.send('HRMS Backend is running'));

// 404
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

module.exports = app;
