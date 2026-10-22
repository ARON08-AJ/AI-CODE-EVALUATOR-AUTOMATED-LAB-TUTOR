import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import rateLimit from 'express-rate-limit';
import {
  getPublishedLabs,
  getTopics,
  getLabsByTopic,
  getLabById as getStudentLabById,
  getStudentAssignments,
  runLabCode,
  submitLabCode
} from '../controllers/student.lab.controller';
import {
  getStudentSubmissions,
  getStudentSubmissionById
} from '../controllers/student.submission.controller';
import { getAIHint, getRunHint } from '../controllers/student.hint.controller';
import { getStudentDashboard } from '../controllers/student.dashboard.controller';
import { getStudentLeaderboard } from '../controllers/student.leaderboard.controller';
import { getStudentAnnouncements } from '../controllers/student.announcement.controller';

const router = Router();

// Secure all student endpoints
router.use(requireAuth);
router.use(requireRole(['STUDENT']));

// Specific strict rate limiters
const executionLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 executions per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many executions, please try again later.' },
  keyGenerator: (req) => req.user?.id || 'unknown'
});

const aiHintLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // 5 hints per 5 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many AI hints requested, please try again later.' },
  keyGenerator: (req) => req.user?.id || 'unknown'
});

router.get('/dashboard', getStudentDashboard);
router.get('/leaderboard', getStudentLeaderboard);
router.get('/announcements', getStudentAnnouncements);

// Topics and Labs
router.get('/topics', getTopics);
router.get('/topics/:topicId/labs', getLabsByTopic);
router.get('/labs', getPublishedLabs);
router.get('/labs/:id', getStudentLabById);
router.get('/assignments', getStudentAssignments);

// Execution & Submission
router.post('/labs/:id/run', executionLimiter, runLabCode);
router.post('/labs/:id/submit', executionLimiter, submitLabCode);

// Submissions
router.get('/submissions', getStudentSubmissions);
router.get('/submissions/:id', getStudentSubmissionById);

// AI Hints
router.post('/submissions/:id/hint', aiHintLimiter, getAIHint);
router.post('/labs/:id/run/hint', aiHintLimiter, getRunHint);

export default router;


