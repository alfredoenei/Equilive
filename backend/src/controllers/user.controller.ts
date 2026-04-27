import { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import prisma from '@/lib/prisma';
import { generateToken } from '@/services/auth.service';

/**
 * Cambia la casa activa del usuario y devuelve un nuevo JWT.
 */
export const switchHouse = asyncHandler(async (req: Request, res: Response) => {
  const { houseId } = req.body;
  const userId = req.user!.id;

  if (!houseId) {
    return res.status(400).json({ success: false, message: 'House ID is required' });
  }

  // Validar si el usuario es miembro de la casa objetivo
  const membership = await prisma.houseMembership.findUnique({
    where: {
      userId_houseId: {
        userId,
        houseId,
      },
    },
  });

  if (!membership) {
    return res.status(403).json({ 
      success: false, 
      message: 'You are not a member of this house' 
    });
  }

  // Actualizar activeHouseId en la DB
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { activeHouseId: houseId },
    select: {
      id: true,
      email: true,
      activeHouseId: true,
    },
  });

  // Generar un NUEVO JWT con el nuevo activeHouseId
  const token = generateToken(updatedUser);

  res.status(200).json({
    success: true,
    data: {
      token,
      activeHouseId: houseId,
    },
  });
});
