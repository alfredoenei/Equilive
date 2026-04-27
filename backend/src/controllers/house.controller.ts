import { Request, Response } from 'express';
import * as houseService from '@/services/house.service';
import { generateToken } from '@/services/auth.service';
import { asyncHandler } from '@/utils/asyncHandler';

export const createHouse = asyncHandler(async (req: Request, res: Response) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, message: 'House name is required' });
  }

  const userId = req.user!.id;
  const house = await houseService.createHouse(name, userId);
  
  // Generate a new token with the houseId
  const newToken = generateToken({ 
    id: userId, 
    email: req.user!.email, 
    activeHouseId: house.id 
  });

  res.status(201).json({ 
    success: true, 
    data: { house, token: newToken } 
  });
});

export const joinHouse = asyncHandler(async (req: Request, res: Response) => {
  const { inviteCode } = req.body;
  if (!inviteCode) {
    return res.status(400).json({ success: false, message: 'Invite code is required' });
  }

  const userId = req.user!.id;
  const result = await houseService.joinHouse(inviteCode, userId);
  
  // Generate a new token with the houseId
  const newToken = generateToken({ 
    id: userId, 
    email: req.user!.email, 
    activeHouseId: result.user.activeHouseId 
  });


  res.status(200).json({ 
    success: true, 
    data: { ...result, token: newToken } 
  });
});

export const getMembers = asyncHandler(async (req: Request, res: Response) => {
  const houseId = req.user!.houseId;
  if (!houseId) {
    return res.status(403).json({ success: false, message: 'No house context' });
  }

  const members = await houseService.getHouseMembers(houseId);
  res.json({ success: true, data: members });
});

export const getMyHouses = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const houses = await houseService.getUserHouses(userId);
  res.json({ success: true, data: houses });
});

export const getCurrentState = asyncHandler(async (req: Request, res: Response) => {
  const houseId = req.user!.houseId;
  const userId = req.user!.id;

  if (!houseId) {
    return res.status(403).json({ success: false, message: 'No house context' });
  }

  const state = await houseService.getHouseState(houseId, userId);
  res.json({ success: true, data: state });
});
