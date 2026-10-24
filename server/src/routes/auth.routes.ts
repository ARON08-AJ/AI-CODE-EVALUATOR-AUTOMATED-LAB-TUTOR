import { Router, Request, Response } from 'express';
import { login, getCurrentUser, changePassword, publicChangePassword, updateProfile } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();

router.post('/login', login);
router.post('/change-password-public', publicChangePassword);
router.get('/me', requireAuth, getCurrentUser);
router.post('/change-password', requireAuth, changePassword);
router.put('/profile', requireAuth, updateProfile);

// Test routes for authorization verification
router.get('/test/student', requireAuth, requireRole(['STUDENT']), (req: Request, res: Response) => {
  res.json({ message: 'Success! You have STUDENT access.' });
});

router.get('/test/faculty', requireAuth, requireRole(['FACULTY']), (req: Request, res: Response) => {
  res.json({ message: 'Success! You have FACULTY access.' });
});

export default router;
