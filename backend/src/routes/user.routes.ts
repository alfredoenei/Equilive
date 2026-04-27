import { Router } from 'express';
import * as userController from '@/controllers/user.controller';
import { authenticate } from '@/middlewares/auth.middleware';

const router = Router();

router.post('/switch-house', authenticate, userController.switchHouse);

export default router;
