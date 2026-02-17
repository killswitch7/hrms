// controllers/holidayController.js
// Small holiday controller for admin + employee holiday APIs.

const mongoose = require('mongoose');
const Holiday = require('../models/Holiday');

function normalizeDate(input) {
  const d = new Date(input);
  d.setHours(0, 0, 0, 0);
  return d;
}

async function getHolidays(req, res) {
  try {
    const { upcoming = 'true' } = req.query;
    const filter = {};

    // For employee view we usually show upcoming holidays.
    if (String(upcoming) !== 'false') {
      filter.date = { $gte: normalizeDate(new Date()) };
    }

    const data = await Holiday.find(filter).sort({ date: 1 }).limit(200);
    return res.json({ data });
  } catch (err) {
    console.error('getHolidays error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function createHoliday(req, res) {
  try {
    const { name, date, type = 'Public', description = '' } = req.body;
    if (!name || !date) {
      return res.status(400).json({ message: 'Name and date are required.' });
    }

    const data = await Holiday.create({
      name: String(name).trim(),
      date: normalizeDate(date),
      type,
      description: String(description).trim(),
    });

    return res.status(201).json({ message: 'Holiday added', data });
  } catch (err) {
    console.error('createHoliday error:', err);
    if (err.code === 11000) {
      return res.status(409).json({ message: 'A holiday already exists for this date.' });
    }
    return res.status(500).json({ message: 'Server error' });
  }
}

async function deleteHoliday(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid holiday id' });
    }

    const deleted = await Holiday.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'Holiday not found' });

    return res.json({ message: 'Holiday deleted' });
  } catch (err) {
    console.error('deleteHoliday error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

module.exports = {
  getHolidays,
  createHoliday,
  deleteHoliday,
};
