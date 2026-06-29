import { Router } from 'express';
import {
  classifyComplaint,
  findDuplicates,
  summarizeComplaint,
  chat,
  getPredictiveAnalytics,
} from '../controllers/aiController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

// All AI routes require authentication
router.use(authenticate);

// Classification: returns predicted category + priority from text
router.post('/classify', classifyComplaint);

// Duplicate detection
router.post('/duplicates', findDuplicates);

// Summarize an existing complaint
router.get('/summarize/:complaintId', summarizeComplaint);

// Chat assistant
router.post('/chat', chat);

// Predictive analytics
router.get('/analytics', getPredictiveAnalytics);

export default router;
