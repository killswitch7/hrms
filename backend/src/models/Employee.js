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

    // Salary entered by admin during register/edit (before tax, yearly amount)
    annualSalary: { type: Number, default: 0 },
    // Tax filing type used in Nepali tax slabs
    filingStatus: {
      type: String,
      enum: ['unmarried', 'married'],
      default: 'unmarried',
    },

    // Old field kept so old code/data does not break.
    // We keep monthly amount here (annualSalary / 12).
    baseSalary: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Employee', employeeSchema);
