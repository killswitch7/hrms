// routes/departmentRoutes.js
const express = require('express');
const {
  getDepartments,
  createDepartment,
  deleteDepartment,
} = require('../controllers/departmentController');

const router = express.Router();

router.get('/', getDepartments);
router.post('/', createDepartment);
router.delete('/:id', deleteDepartment);

module.exports = router;
