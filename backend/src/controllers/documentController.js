// controllers/documentController.js
// Handles document request flow:
// employee/manager -> request
// admin -> approve/reject/view document

const mongoose = require('mongoose');
const DocumentRequest = require('../models/DocumentRequest');
const Employee = require('../models/Employee');
const { getOrCreateEmployeeForUser } = require('./employeeController');
const { renderDocumentHtml } = require('../services/pdfService');

const allowedTypes = [
  'Experience Letter',
  'Salary Certificate',
  'Employment Verification',
  'No Objection Certificate',
];

function formatCurrency(value) {
  const num = Number(value || 0);
  return `INR ${num.toLocaleString('en-IN')}`;
}

// Employee/manager create own document request
async function createMyDocumentRequest(req, res) {
  try {
    const { type, purpose = '' } = req.body;
    if (!allowedTypes.includes(String(type))) {
      return res.status(400).json({ message: 'Invalid document type.' });
    }

    const employee = await getOrCreateEmployeeForUser(req.user);
    const doc = await DocumentRequest.create({
      employee: employee._id,
      requestedByRole: req.user.role === 'manager' ? 'manager' : 'employee',
      type,
      purpose: String(purpose).trim(),
      status: 'Pending',
    });

    return res.status(201).json({ message: 'Document request submitted', data: doc });
  } catch (err) {
    console.error('createMyDocumentRequest error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// Employee/manager see own document requests
async function getMyDocumentRequests(req, res) {
  try {
    const employee = await getOrCreateEmployeeForUser(req.user);
    const data = await DocumentRequest.find({ employee: employee._id }).sort({ createdAt: -1 });
    return res.json({ data });
  } catch (err) {
    console.error('getMyDocumentRequests error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// Admin sees all document requests
async function getAdminDocumentRequests(req, res) {
  try {
    const { status = '', role = '', search = '' } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (role && ['employee', 'manager'].includes(String(role))) {
      filter.requestedByRole = role;
    }

    let employeeFilter = {};
    if (search) {
      const regex = new RegExp(String(search).trim(), 'i');
      employeeFilter = {
        $or: [{ employeeId: regex }, { firstName: regex }, { lastName: regex }, { email: regex }],
      };
    }

    const matchedEmployees = await Employee.find(employeeFilter).select('_id');
    if (search) {
      filter.employee = { $in: matchedEmployees.map((x) => x._id) };
    }

    const data = await DocumentRequest.find(filter)
      .populate('employee', 'employeeId firstName lastName email department designation baseSalary')
      .sort({ createdAt: -1 });

    return res.json({ data });
  } catch (err) {
    console.error('getAdminDocumentRequests error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// Admin approve request and generate document HTML from template
async function approveDocumentRequest(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid request id.' });
    }

    const requestDoc = await DocumentRequest.findById(id).populate(
      'employee',
      'employeeId firstName lastName email department designation baseSalary'
    );
    if (!requestDoc) return res.status(404).json({ message: 'Request not found.' });

    const employee = requestDoc.employee;
    const payload = {
      issueDate: new Date().toLocaleDateString('en-GB'),
      employeeName: `${employee.firstName || ''} ${employee.lastName || ''}`.trim(),
      employeeId: employee.employeeId || '',
      designation: employee.designation || 'Employee',
      department: employee.department || 'N/A',
      purpose: requestDoc.purpose || 'Official purpose',
      salary: formatCurrency(employee.baseSalary),
    };

    const html = renderDocumentHtml(requestDoc.type, payload);

    requestDoc.status = 'Approved';
    requestDoc.generatedHtml = html;
    requestDoc.reviewedBy = req.user._id;
    requestDoc.reviewedAt = new Date();
    requestDoc.rejectionReason = '';
    await requestDoc.save();

    return res.json({ message: 'Document request approved', data: requestDoc });
  } catch (err) {
    console.error('approveDocumentRequest error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// Admin reject request
async function rejectDocumentRequest(req, res) {
  try {
    const { id } = req.params;
    const { reason = '' } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid request id.' });
    }

    const requestDoc = await DocumentRequest.findById(id);
    if (!requestDoc) return res.status(404).json({ message: 'Request not found.' });

    requestDoc.status = 'Rejected';
    requestDoc.reviewedBy = req.user._id;
    requestDoc.reviewedAt = new Date();
    requestDoc.rejectionReason = String(reason).trim();
    requestDoc.generatedHtml = '';
    await requestDoc.save();

    return res.json({ message: 'Document request rejected', data: requestDoc });
  } catch (err) {
    console.error('rejectDocumentRequest error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// Admin view generated document
async function getApprovedDocumentHtml(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid request id.' });
    }
    const doc = await DocumentRequest.findById(id);
    if (!doc) return res.status(404).json({ message: 'Request not found.' });
    if (doc.status !== 'Approved' || !doc.generatedHtml) {
      return res.status(400).json({ message: 'Document is not generated yet.' });
    }
    return res.json({ data: { html: doc.generatedHtml, type: doc.type } });
  } catch (err) {
    console.error('getApprovedDocumentHtml error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// Employee/manager view own approved document
async function getMyApprovedDocumentHtml(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid request id.' });
    }

    const employee = await getOrCreateEmployeeForUser(req.user);
    const doc = await DocumentRequest.findOne({ _id: id, employee: employee._id });
    if (!doc) return res.status(404).json({ message: 'Request not found.' });
    if (doc.status !== 'Approved' || !doc.generatedHtml) {
      return res.status(400).json({ message: 'Document is not generated yet.' });
    }

    return res.json({ data: { html: doc.generatedHtml, type: doc.type } });
  } catch (err) {
    console.error('getMyApprovedDocumentHtml error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

module.exports = {
  allowedTypes,
  createMyDocumentRequest,
  getMyDocumentRequests,
  getMyApprovedDocumentHtml,
  getAdminDocumentRequests,
  approveDocumentRequest,
  rejectDocumentRequest,
  getApprovedDocumentHtml,
};
