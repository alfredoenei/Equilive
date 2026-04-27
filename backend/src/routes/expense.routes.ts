import { Router } from 'express';
import * as expenseController from '@/controllers/expense.controller';
import { authenticate } from '@/middlewares/auth.middleware';
import { requireHouse } from '@/middlewares/requireHouse';

const router = Router();

router.use(authenticate);
router.use(requireHouse);

router.get('/', expenseController.getExpenses);
router.post('/', expenseController.createExpense);
router.get('/balances', expenseController.getBalances);
router.post('/settle', expenseController.settleDebt);


export default router;

