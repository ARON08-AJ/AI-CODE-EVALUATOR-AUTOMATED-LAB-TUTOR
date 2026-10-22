import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import {
  getAdminDashboard,
  addFaculty,
  updateFaculty,
  updateFacultyStatus,
  getStudents,
  updateStudentStatus,
  resetUserPassword,
  getSystemActivity
} from '../controllers/admin.controller';

const router = Router();

router.use(requireAuth);
router.use(requireRole(['ADMIN']));

router.get('/dashboard', getAdminDashboard);
router.get('/students', getStudents);
router.post('/faculty', addFaculty);
router.put('/faculty/:id', updateFaculty);
router.patch('/faculty/:id/status', updateFacultyStatus);
router.patch('/students/:id/status', updateStudentStatus);

// Advanced Admin Capabilities
router.post('/users/:id/reset-password', resetUserPassword);
router.get('/activity', getSystemActivity);

export default router;
