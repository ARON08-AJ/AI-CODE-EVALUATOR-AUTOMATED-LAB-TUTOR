import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { getTags, createTag, updateTag, deleteTag } from '../controllers/tag.controller';

const router = Router();

router.use(requireAuth);

router.get('/', getTags);
router.post('/', requireRole(['FACULTY', 'ADMIN']), createTag);
router.put('/:id', requireRole(['FACULTY', 'ADMIN']), updateTag);
router.delete('/:id', requireRole(['FACULTY', 'ADMIN']), deleteTag);

export default router;
