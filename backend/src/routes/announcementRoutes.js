// routes/announcementRoutes.js
// Admin announcement routes.

const express = require('express');
const {
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
} = require('../controllers/announcementController');

const router = express.Router();
const managerAnnouncementRouter = express.Router();

router.get('/', getAnnouncements);
router.post('/', createAnnouncement);
router.delete('/:id', deleteAnnouncement);

// Manager can only view announcements.
managerAnnouncementRouter.get('/', getAnnouncements);

module.exports = router;
module.exports.managerAnnouncementRouter = managerAnnouncementRouter;
