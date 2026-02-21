// models/DocumentRequest.js
// Stores document requests from employee/manager.

const mongoose = require('mongoose');

const documentRequestSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    requestedByRole: {
      type: String,
      enum: ['employee', 'manager'],
      required: true,
    },
    type: {
      type: String,
      enum: [
        'Experience Letter',
        'Salary Certificate',
        'Employment Verification',
        'No Objection Certificate',
      ],
      required: true,
    },
    purpose: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    // Generated HTML content from template on approval.
    generatedHtml: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('DocumentRequest', documentRequestSchema);

