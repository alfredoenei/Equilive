import prisma from '@/lib/prisma';
import { Request, Response } from 'express';
import * as expenseService from '@/services/expense.service';
import { createExpenseSchema } from '@/schemas/expense.schema';
import { asyncHandler } from '@/utils/asyncHandler';
import { emitToHouse } from '@/lib/socket';
import * as alertService from '@/services/alert.service';

export const getExpenses = asyncHandler(async (req: Request, res: Response) => {
  const houseId = req.user!.houseId!;
  const expenses = await expenseService.getExpenses(houseId);
  res.json({ success: true, data: expenses });
});

export const createExpense = asyncHandler(async (req: Request, res: Response) => {
  const houseId = req.user!.houseId!;
  const payerId = req.user!.id;
  const validatedData = createExpenseSchema.parse({ ...req.body, payerId });
  
  const expense = await expenseService.createExpense(validatedData, houseId);
  
  // Real-time update
  emitToHouse(houseId, 'expense_created', expense);

  // Persistent Alert
  const user = await prisma.user.findUnique({ where: { id: payerId }, select: { name: true } });
  await alertService.createHouseAlerts(
    payerId, 
    houseId, 
    'EXPENSE', 
    `${user?.name} ha añadido un gasto: ${expense.description}`
  );

  res.status(201).json({ success: true, data: expense });
});

export const getBalances = asyncHandler(async (req: Request, res: Response) => {
  const houseId = req.user!.houseId!;
  const balances = await expenseService.getBalances(houseId);
  res.json({ success: true, data: balances });
});

export const settleDebt = asyncHandler(async (req: Request, res: Response) => {
  const { toUserId, amount } = req.body;
  const fromUserId = req.user!.id;
  const houseId = req.user!.houseId!;

  if (!toUserId || !amount) {
    return res.status(400).json({ success: false, message: 'Faltan datos para la liquidación.' });
  }

  // 1. Crear el gasto de liquidación usando el servicio
  const settlement = await expenseService.settleUp(fromUserId, toUserId, Number(amount), houseId);

  // Real-time update
  emitToHouse(houseId, 'settlement_created', { 
    settlement, 
    fromUserId, 
    toUserId,
    amount 
  });

  // Parallel side-effects: alert + karma (independent operations)
  const fromUser = await prisma.user.findUnique({ where: { id: fromUserId }, select: { name: true } });
  
  await Promise.all([
    alertService.createAlert(
      toUserId,
      houseId,
      'SETTLEMENT',
      `${fromUser?.name} te ha pagado $${amount}`
    ),
    prisma.karmaTransaction.create({
      data: {
        userId: fromUserId,
        amount: 10,
        reason: 'Liquidación de deuda',
      }
    }),
    prisma.user.update({
      where: { id: fromUserId },
      data: { karma: { increment: 10 } }
    }),
  ]);

  res.json({
    success: true,
    data: settlement,
    message: 'Deuda liquidada correctamente.'
  });
});
