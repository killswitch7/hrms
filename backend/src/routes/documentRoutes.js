// routes/documentRoutes.js
// Document request routes for employee/manager/admin.

const express = require('express');
const {
  createMyDocumentRequest,
  getMyDocumentRequests,
  getMyApprovedDocumentHtml,
  getAdminDocumentRequests,
  approveDocumentRequest,
  rejectDocumentRequest,
  getApprovedDocumentHtml,
} = require('../controllers/documentController');

const selfDocumentRouter = express.Router();
selfDocumentRouter.post('/', createMyDocumentRequest);
selfDocumentRouter.get('/', getMyDocumentRequests);
selfDocumentRouter.get('/:id/view', getMyApprovedDocumentHtml);

const adminDocumentRouter = express.Router();
adminDocumentRouter.get('/', getAdminDocumentRequests);
adminDocumentRouter.patch('/:id/approve', approveDocumentRequest);
adminDocumentRouter.patch('/:id/reject', rejectDocumentRequest);
adminDocumentRouter.get('/:id/view', getApprovedDocumentHtml);

module.exports = {
  selfDocumentRouter,
  adminDocumentRouter,
};
