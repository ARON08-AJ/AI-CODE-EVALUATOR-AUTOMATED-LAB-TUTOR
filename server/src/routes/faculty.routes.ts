import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { 
  getStudents, 
  getStudentMetadata,
  getStudentById, 
  previewBulkEnrollment, 
  bulkEnrollStudents,
  addSingleStudent,
  getSubmissionById
} from '../controllers/faculty.controller';
import {
  createLab,
  getLabs,
  getLabById as getFacultyLabById,
  updateLab,
  deleteLab,
  publishLab,
  unpublishLab,
  createTestCase,
  deleteTestCase,
  bulkImportLabs,
  bulkImportTestCases,
  exportLabs,
  exportTestCases
} from '../controllers/faculty.lab.controller';
import {
  assignLab,
  getLabAssignments,
  unassignStudent,
  updateAssignmentDeadline
} from '../controllers/faculty.assignment.controller';
import { getFacultyDashboard } from '../controllers/faculty.dashboard.controller';
import { getFacultyAnalytics } from '../controllers/faculty.analytics.controller';
import {
  getFacultyAnnouncements,
  createAnnouncement,
  getFacultyAnnouncementById,
  updateAnnouncement,
  publishAnnouncement,
  unpublishAnnouncement,
  deleteAnnouncement
} from '../controllers/faculty.announcement.controller';

const router = Router();

// Secure all faculty endpoints
router.use(requireAuth);
router.use(requireRole(['FACULTY', 'ADMIN']));

router.get('/dashboard', getFacultyDashboard);
router.get('/analytics', getFacultyAnalytics);

// Students
router.get('/students', getStudents);
router.get('/students/metadata', getStudentMetadata);
router.post('/students', addSingleStudent);
router.get('/students/:id', getStudentById);
router.post('/students/bulk/preview', previewBulkEnrollment);
router.post('/students/bulk', bulkEnrollStudents);
router.get('/submissions/:id', getSubmissionById);

// Labs
import multer from 'multer';
const upload = multer({ storage: multer.memoryStorage() });

router.post('/labs', createLab);
router.post('/labs/bulk-import', upload.single('file'), bulkImportLabs);
router.get('/labs/export', exportLabs);
router.get('/labs', getLabs);
router.get('/labs/:id', getFacultyLabById);
router.put('/labs/:id', updateLab);
router.delete('/labs/:id', deleteLab);
router.patch('/labs/:id/publish', publishLab);
router.patch('/labs/:id/unpublish', unpublishLab);

// Assignments
router.post('/labs/:id/assign', assignLab);
router.get('/labs/:id/assignments', getLabAssignments);
router.patch('/labs/:id/assignments/deadline', updateAssignmentDeadline);
router.delete('/labs/:labId/assignments/:studentId', unassignStudent);

// Test Cases
router.post('/labs/test-cases/bulk-import', upload.single('file'), bulkImportTestCases);
router.get('/labs/test-cases/export', exportTestCases);
router.post('/labs/:id/test-cases', createTestCase);
router.delete('/test-cases/:id', deleteTestCase);

// Announcements
router.get('/announcements', getFacultyAnnouncements);
router.post('/announcements', createAnnouncement);
router.get('/announcements/:id', getFacultyAnnouncementById);
router.put('/announcements/:id', updateAnnouncement);
router.patch('/announcements/:id/publish', publishAnnouncement);
router.patch('/announcements/:id/unpublish', unpublishAnnouncement);
router.delete('/announcements/:id', deleteAnnouncement);

export default router;

