import { Request, Response } from 'express';
import prisma from '@/lib/prisma';
import { asyncHandler } from '@/utils/asyncHandler';

export const getKarmaHistory = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;

  // Obtener la fecha de hace 7 días
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const transactions = await prisma.karmaTransaction.findMany({
    where: {
      userId,
      createdAt: {
        gte: sevenDaysAgo
      }
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  // Agrupar por día
  const historyMap = new Map();
  
  // Inicializar los últimos 7 días con 0
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    historyMap.set(dateStr, 0);
  }

  // Llenar con datos reales
  transactions.forEach(t => {
    const dateStr = t.createdAt.toISOString().split('T')[0];
    if (historyMap.has(dateStr)) {
      historyMap.set(dateStr, historyMap.get(dateStr) + t.amount);
    }
  });

  // Convertir a array para el frontend
  const data = Array.from(historyMap).map(([date, amount]) => ({
    date,
    amount
  }));

  res.json({
    success: true,
    data
  });
});
