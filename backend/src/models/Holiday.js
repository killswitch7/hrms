// backend/src/models/Holiday.js
const mongoose = require('mongoose');

const holidaySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    // Keep old field for backward compatibility with old UI/data.
    // For new UI we use startDate + endDate.
    date: { type: Date },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    type: {
      type: String,
      enum: ['Public', 'Company', 'Optional', 'Festival'],
      default: 'Public',
    },
    description: { type: String },
  },
  { timestamps: true }
);

holidaySchema.index({ startDate: 1, endDate: 1 });

module.exports = mongoose.model('Holiday', holidaySchema);
