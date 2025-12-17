// backend/src/models/Announcement.js
const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema(
  {
    title:   { type: String, required: true },
    content: { type: String, required: true },
    type: {
      type: String,
      enum: ['General', 'HR', 'Holiday', 'System'],
      default: 'General',
    },
    audience: {
      type: String,
      enum: ['All', 'Employees', 'Admins'],
      default: 'All',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    effectiveFrom: { type: Date },
    effectiveTo:   { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Announcement', announcementSchema);
