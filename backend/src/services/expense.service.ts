import prisma from '../lib/prisma';
import { CreateExpenseInput } from '../schemas/expense.schema';
import { calculateSettlements } from './debtEngine.service';

export const getExpenses = async (houseId: string) => {
  return await prisma.expense.findMany({
    where: { houseId },
    select: {
      id: true,
      description: true,
      amount: true,
      category: true,
      createdAt: true,
      payerId: true,
      receiverId: true,
      payer: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const createExpense = async (data: CreateExpenseInput, houseId: string) => {
  return await prisma.expense.create({
    data: {
      ...data,
      houseId,
    },
  });
};

export const getBalances = async (houseId: string) => {
  // Parallel fetch: users + expenses at the same time
  const [users, expenses] = await Promise.all([
    prisma.user.findMany({
      where: {
        memberships: {
          some: { houseId }
        }
      },
      select: { id: true, name: true },
    }),
    prisma.expense.findMany({
      where: { houseId },
      select: { amount: true, payerId: true, category: true, receiverId: true },
    }),
  ]);

  return calculateSettlements(
    users,
    expenses.map(e => ({
      ...e,
      receiverId: e.receiverId ?? undefined,
      category: e.category ?? undefined
    }))
  );
};

export const settleUp = async (payerId: string, receiverId: string, amount: number, houseId: string) => {
  return await prisma.expense.create({
    data: {
      description: "Liquidación de deuda",
      amount,
      category: "SETTLEMENT",
      payerId,
      receiverId,
      houseId,
    },
  });
};
