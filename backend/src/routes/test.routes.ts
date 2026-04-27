import { Router, Request, Response } from 'express';
import prisma from '@/lib/prisma';
import { authenticate } from '@/middlewares/auth.middleware';
import { asyncHandler } from '@/utils/asyncHandler';

const router = Router();

router.post('/seed', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const houseId = req.user!.houseId;

  if (!houseId) {
    return res.status(400).json({ success: false, message: 'Debes estar en una casa para usar el seed.' });
  }

  // 1. Buscar o crear un "compañero ficticio" en la misma casa
  let roommate = await prisma.user.findFirst({
    where: {
      memberships: {
        some: { houseId }
      },
      NOT: { id: userId }
    }
  });

  if (!roommate) {
    // Intentar buscar al bot por email antes de crearlo
    const botEmail = `bot_${houseId}@equilive.com`;
    roommate = await prisma.user.findUnique({ where: { email: botEmail } });

    if (!roommate) {
      // Si el bot no existe en absoluto, crearlo con su membresía
      roommate = await prisma.user.create({
        data: {
          email: botEmail,
          passwordHash: 'dummy_hash',
          name: 'Compañero Bot',
          activeHouseId: houseId,
          memberships: {
            create: { houseId }
          }
        }
      });
    } else {
      // Si el bot ya existe (de otra casa), simplemente lo unimos a esta
      await prisma.houseMembership.upsert({
        where: {
          userId_houseId: {
            userId: roommate.id,
            houseId: houseId
          }
        },
        create: {
          userId: roommate.id,
          houseId: houseId
        },
        update: {} // No hacemos nada si ya es miembro
      });
    }
  }

  // 2. Crear Tareas
  await prisma.task.createMany({
    data: [
      { title: 'Limpiar la cocina', description: 'Dejar el fregadero brillante', karmaReward: 20, houseId, assigneeId: userId },
      { title: 'Comprar suministros', description: 'Falta papel y detergente', karmaReward: 15, houseId, assigneeId: userId },
      { title: 'Sacar la basura', description: 'Orgánico y plástico', karmaReward: 10, houseId, assigneeId: userId },
    ]
  });

  // 3. Crear Gasto (Donde el BOT paga, para que TU debas dinero)
  await prisma.expense.create({
    data: {
      description: 'Supermercado Mensual',
      amount: 100,
      payerId: roommate.id,
      houseId
    }
  });

  res.json({
    success: true,
    message: '¡Casa sembrada con éxito! Ahora tienes 3 tareas y debes $50.'
  });
}));

export default router;
