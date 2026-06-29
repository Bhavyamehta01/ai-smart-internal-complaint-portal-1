import { Router } from 'express';
import {
  createComplaint,
  getMyComplaints,
  getComplaintById,
  addComment,
  getReferenceData,
} from '../controllers/complaintController';
import { getMyStats } from '../controllers/adminController';
import { authenticate } from '../middlewares/authMiddleware';
import { upload } from '../middlewares/upload';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Reference data (departments + categories for forms)
router.get('/reference', getReferenceData);

// Employee stats
router.get('/my-stats', getMyStats);

// Complaint CRUD
router.get('/complaints', getMyComplaints);
router.post('/complaints', upload.array('attachments', 5), createComplaint);
router.get('/complaints/:id', getComplaintById);
router.post('/complaints/:id/comments', addComment);

export default router;
