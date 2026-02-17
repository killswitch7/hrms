// routes/announcementRoutes.js
// Admin announcement routes.

const express = require('express');
const {
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
} = require('../controllers/announcementController');

const router = express.Router();

router.get('/', getAnnouncements);
router.post('/', createAnnouncement);
router.delete('/:id', deleteAnnouncement);

module.exports = router;
