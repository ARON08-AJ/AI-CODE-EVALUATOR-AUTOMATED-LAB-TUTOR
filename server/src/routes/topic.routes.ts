import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { getTopics, createTopic, getTopicLabs, seedDefaultTopic } from '../controllers/topic.controller';

const router = Router();

router.use(requireAuth);
router.use(requireRole(['FACULTY']));

router.get('/', getTopics);
router.post('/', createTopic);
router.post('/seed', seedDefaultTopic);
router.get('/:id/labs', getTopicLabs);

export default router;
