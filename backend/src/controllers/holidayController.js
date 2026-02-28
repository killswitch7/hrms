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
    const today = normalizeDate(new Date());
    const filter = {};

    // For employee view we usually show upcoming holidays.
    if (String(upcoming) !== 'false') {
      // Include:
      // 1) New records where range ends today or later
      // 2) Old records (date-only) where date is today or later
      filter.$or = [{ endDate: { $gte: today } }, { date: { $gte: today } }];
    }

    const data = await Holiday.find(filter)
      .sort({ startDate: 1, date: 1 })
      .limit(200);

    const mapped = data.map((h) => {
      const startDate = h.startDate || h.date;
      const endDate = h.endDate || h.startDate || h.date;
      return {
        _id: h._id,
        name: h.name,
        date: startDate, // keep old key so old frontend still works
        startDate,
        endDate,
        type: h.type,
        description: h.description,
        createdAt: h.createdAt,
        updatedAt: h.updatedAt,
      };
    });
    return res.json({ data: mapped });
  } catch (err) {
    console.error('getHolidays error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function createHoliday(req, res) {
  try {
    const {
      name,
      date, // old payload support
      startDate: rawStartDate,
      endDate: rawEndDate,
      type = 'Public',
      description = '',
    } = req.body;

    const startInput = rawStartDate || date;
    const endInput = rawEndDate || rawStartDate || date;

    if (!name || !startInput) {
      return res.status(400).json({ message: 'Name and start date are required.' });
    }

    const startDate = normalizeDate(startInput);
    const endDate = normalizeDate(endInput);
    if (endDate < startDate) {
      return res.status(400).json({ message: 'End date cannot be before start date.' });
    }

    const data = await Holiday.create({
      name: String(name).trim(),
      date: startDate, // keep old field populated
      startDate,
      endDate,
      type,
      description: String(description).trim(),
    });

    return res.status(201).json({ message: 'Holiday added', data });
  } catch (err) {
    console.error('createHoliday error:', err);
    if (err.code === 11000) {
      return res.status(409).json({
        message:
          'Duplicate holiday date blocked by old DB index. Please remove unique index `date_1` once.',
      });
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
