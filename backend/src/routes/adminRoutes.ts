import { Router } from 'express';
import { getDashboardStats, getAllUsers, getAuditLogs } from '../controllers/adminController';
import {
  getAllComplaints,
  getComplaintById,
  updateComplaintStatus,
  assignComplaint,
  addComment,
  deleteComplaint,
} from '../controllers/complaintController';
import { authenticate, requireRole } from '../middlewares/authMiddleware';

const router = Router();

// All admin routes require authentication + ADMIN role
router.use(authenticate);
router.use(requireRole(['ADMIN']));

// Dashboard
router.get('/dashboard', getDashboardStats);

// Complaint management
router.get('/complaints', getAllComplaints);
router.get('/complaints/:id', getComplaintById);
router.patch('/complaints/:id/status', updateComplaintStatus);
router.patch('/complaints/:id/assign', assignComplaint);
router.post('/complaints/:id/comments', addComment);
router.delete('/complaints/:id', deleteComplaint);

// User management
router.get('/users', getAllUsers);

// Audit logs
router.get('/audit-logs', getAuditLogs);

export default router;
