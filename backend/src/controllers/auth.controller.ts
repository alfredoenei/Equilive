import { Request, Response } from 'express';
import * as authService from '@/services/auth.service';
import { registerSchema, loginSchema } from '@/schemas/auth.schema';
import { asyncHandler } from '@/utils/asyncHandler';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = registerSchema.parse(req.body);
  const user = await authService.register(validatedData);
  res.status(201).json({ success: true, data: user });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = loginSchema.parse(req.body);
  const result = await authService.login(validatedData);
  res.status(200).json({ success: true, data: result });
});

