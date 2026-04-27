import { Router } from 'express';
import * as karmaController from '@/controllers/karma.controller';
import { authenticate } from '@/middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/history', karmaController.getKarmaHistory);

export default router;
