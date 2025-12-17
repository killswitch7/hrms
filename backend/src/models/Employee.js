// backend/src/models/Employee.js
const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    employeeId: {
      type: String,
      required: true,
      unique: true,
    },
    firstName: { type: String, required: true },
    lastName: { type: String, default: '' },
    email: { type: String, required: true },
    phone: { type: String },

    department: { type: String },
    designation: { type: String },

    joinDate: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },

    baseSalary: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Employee', employeeSchema);
