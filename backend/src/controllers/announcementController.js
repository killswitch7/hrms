// controllers/announcementController.js
// Simple CRUD for announcements.

const mongoose = require('mongoose');
const Announcement = require('../models/Announcement');

async function getAnnouncements(req, res) {
  try {
    const data = await Announcement.find({}).sort({ createdAt: -1 }).limit(100);
    return res.json({ data });
  } catch (err) {
    console.error('getAnnouncements error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function createAnnouncement(req, res) {
  try {
    const { title, content, type = 'General', audience = 'All', effectiveFrom, effectiveTo } = req.body;
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required.' });
    }

    const data = await Announcement.create({
      title: String(title).trim(),
      content: String(content).trim(),
      type,
      audience,
      effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : undefined,
      effectiveTo: effectiveTo ? new Date(effectiveTo) : undefined,
      createdBy: req.user._id,
    });

    return res.status(201).json({ message: 'Announcement created', data });
  } catch (err) {
    console.error('createAnnouncement error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function deleteAnnouncement(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid announcement id' });
    }

    const deleted = await Announcement.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'Announcement not found' });
    return res.json({ message: 'Announcement deleted' });
  } catch (err) {
    console.error('deleteAnnouncement error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

module.exports = {
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
};
