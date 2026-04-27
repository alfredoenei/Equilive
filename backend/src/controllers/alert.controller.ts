import { Request, Response } from 'express';
import * as alertService from '@/services/alert.service';
import { asyncHandler } from '@/utils/asyncHandler';

export const getAlerts = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const houseId = req.user!.houseId;

  if (!houseId) {
    return res.status(403).json({ success: false, message: 'No house context' });
  }

  const alerts = await alertService.getUserAlerts(userId, houseId);
  res.json({ success: true, data: alerts });
});

export const markRead = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const houseId = req.user!.houseId;

  if (!houseId) {
    return res.status(403).json({ success: false, message: 'No house context' });
  }

  await alertService.markAllAsRead(userId, houseId);
  res.json({ success: true, message: 'Alerts marked as read' });
});
