// backend/src/app.js
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const authRoute = require('./routes/auth');
const adminRoute = require('./routes/admin');
const managerRoute = require('./routes/manager');
const employeeRoute = require('./routes/employee');
const departmentRoutes = require('./routes/departmentRoutes');
const { protect, requireRole } = require('./middleware/auth');

const app = express();

// Connect DB
connectDB();

// Body parser
app.use(express.json());

// Avoid 304s for API responses (Angular treats non-2xx as error)
app.disable('etag');
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

// CORS
const allowedOrigins = [
  'http://localhost:4200',
  'http://localhost:58831',
  'http://127.0.0.1:4200',
  'http://127.0.0.1:58831',
];

app.use(
  cors({
    origin: (origin, cb) => {
      // allow non-browser tools (no Origin)
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      // allow any localhost port for dev
      if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        return cb(null, true);
      }
      return cb(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);

// Handle preflight requests for all routes
app.options(/.*/, cors());

// Routes
app.use('/api/auth', authRoute);
app.use('/api/admin', adminRoute);      // <-- IMPORTANT
app.use('/api/manager', managerRoute);
app.use('/api/employee', employeeRoute);
// Department endpoints (mounted directly also to avoid route mismatch issues)
app.use('/api/admin/departments', protect, requireRole('admin'), departmentRoutes);
app.use('/api/departments', protect, requireRole('admin'), departmentRoutes);

// Test route
app.get('/', (req, res) => res.send('HRMS Backend is running'));

// 404
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

module.exports = app;
