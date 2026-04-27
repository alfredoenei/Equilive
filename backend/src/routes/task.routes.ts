import { Router } from 'express';
import * as taskController from '@/controllers/task.controller';
import { authenticate } from '@/middlewares/auth.middleware';
import { requireHouse } from '@/middlewares/requireHouse';

const router = Router();

router.use(authenticate);
router.use(requireHouse);

router.get('/', taskController.getTasks);
router.get('/recommend', taskController.recommendAssignee);
router.post('/', taskController.createTask);
router.patch('/:id/complete', taskController.completeTask);
router.delete('/:id', taskController.deleteTask);

export default router;

