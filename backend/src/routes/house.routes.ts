import { Router } from 'express';
import * as houseController from '@/controllers/house.controller';
import { authenticate } from '@/middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/', houseController.createHouse);
router.post('/join', houseController.joinHouse);
router.get('/members', houseController.getMembers);
router.get('/my-houses', houseController.getMyHouses);
router.get('/current-state', houseController.getCurrentState);

export default router;

