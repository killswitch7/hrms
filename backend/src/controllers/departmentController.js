// controllers/departmentController.js
// Simple department CRUD for admin use.

const mongoose = require('mongoose');
const Department = require('../models/Department');

async function getDepartments(req, res) {
  try {
    const data = await Department.find({}).sort({ name: 1 });
    return res.json({ data });
  } catch (err) {
    console.error('getDepartments error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function createDepartment(req, res) {
  try {
    const { name } = req.body;
    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: 'Department name is required.' });
    }

    const data = await Department.create({
      name: String(name).trim(),
    });
    return res.status(201).json({ message: 'Department created', data });
  } catch (err) {
    console.error('createDepartment error:', err);
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Department already exists.' });
    }
    return res.status(500).json({ message: 'Server error' });
  }
}

async function deleteDepartment(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid department id' });
    }
    const deleted = await Department.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'Department not found' });
    return res.json({ message: 'Department deleted' });
  } catch (err) {
    console.error('deleteDepartment error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

module.exports = {
  getDepartments,
  createDepartment,
  deleteDepartment,
};
