// backend/src/models/Holiday.js
const mongoose = require('mongoose');

const holidaySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    date: { type: Date, required: true },
    type: {
      type: String,
      enum: ['Public', 'Company', 'Optional', 'Festival'],
      default: 'Public',
    },
    description: { type: String },
  },
  { timestamps: true }
);

holidaySchema.index({ date: 1 }, { unique: true });

module.exports = mongoose.model('Holiday', holidaySchema);
