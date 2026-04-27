import { Request, Response } from 'express';
import * as dashboardService from '@/services/dashboard.service';
import { asyncHandler } from '@/utils/asyncHandler';

export const getDashboardSummary = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const summary = await dashboardService.getDashboardData(userId);
  res.json({ success: true, data: summary });
});

