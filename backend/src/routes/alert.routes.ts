import { Router } from 'express';
import * as alertController from '@/controllers/alert.controller';
import { authenticate } from '@/middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', alertController.getAlerts);
router.patch('/read', alertController.markRead);

export default router;
