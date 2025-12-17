// backend/src/models/Payroll.js
const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    month: {
      type: String, // e.g. '2025-01'
      required: true,
    },
    basic:      { type: Number, required: true },
    allowance:  { type: Number, default: 0 },
    deductions: { type: Number, default: 0 },
    netPay:     { type: Number, required: true },
    status: {
      type: String,
      enum: ['Pending', 'Processed', 'Paid'],
      default: 'Processed',
    },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

payrollSchema.index({ employee: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('Payroll', payrollSchema);
