import prisma from '../lib/prisma';
import { AppError } from '../utils/AppError';
import crypto from 'crypto';
import { calculateSettlements } from './debtEngine.service';

export const createHouse = async (name: string, userId: string) => {
  // Generate a unique 6-character alphanumeric invite code
  let inviteCode = '';
  let isUnique = false;

  while (!isUnique) {
    inviteCode = crypto.randomBytes(3).toString('hex').toUpperCase();
    const existing = await prisma.house.findUnique({ where: { inviteCode } });
    if (!existing) isUnique = true;
  }

  // ATOMIC TRANSACTION: Crear casa + membresía + actualizar activeHouseId
  return await prisma.$transaction(async (tx) => {
    const house = await tx.house.create({
      data: {
        name,
        inviteCode,
        memberships: {
          create: { 
            userId,
            role: 'ADMIN' 
          },
        },
      },
    });

    await tx.user.update({
      where: { id: userId },
      data: { activeHouseId: house.id },
    });

    return house;
  });
};

export const joinHouse = async (inviteCode: string, userId: string) => {
  const house = await prisma.house.findUnique({
    where: { inviteCode: inviteCode.toUpperCase() },
  });

  if (!house) {
    throw new AppError('Invalid invite code', 404);
  }

  // ATOMIC TRANSACTION: Crear membresía + actualizar activeHouseId
  return await prisma.$transaction(async (tx) => {
    await tx.houseMembership.upsert({
      where: {
        userId_houseId: {
          userId,
          houseId: house.id
        }
      },
      create: {
        userId,
        houseId: house.id,
        role: 'MEMBER'
      },
      update: {} // No hacemos nada si ya es miembro
    });

    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: { activeHouseId: house.id },
      select: {
        id: true,
        name: true,
        email: true,
        activeHouseId: true,
      },
    });

    return { house, user: updatedUser };
  });
};

export const getHouseMembers = async (houseId: string) => {
  return await prisma.user.findMany({
    where: {
      memberships: {
        some: { houseId }
      }
    },
    select: {
      id: true,
      name: true,
      email: true
    }
  });
};

export const getUserHouses = async (userId: string) => {
  return await prisma.house.findMany({
    where: {
      memberships: {
        some: { userId }
      }
    },
    select: {
      id: true,
      name: true,
      inviteCode: true,
      createdAt: true,
      _count: {
        select: { memberships: true }
      }
    }
  });
};

interface HouseStateExpense {
  id: string;
  description: string;
  amount: number;
  category: string | null;
  payerId: string;
  receiverId: string | null;
  createdAt: Date;
  payer: { name: string };
}

export const getHouseState = async (houseId: string, userId: string) => {
  const [house, members, expenses, tasks, alerts] = await Promise.all([
    prisma.house.findUnique({ 
      where: { id: houseId },
      select: {
        id: true,
        name: true,
        inviteCode: true,
        _count: { select: { memberships: true } }
      }
    }),
    getHouseMembers(houseId),
    prisma.expense.findMany({
      where: { houseId },
      select: {
        id: true,
        description: true,
        amount: true,
        category: true,
        payerId: true,
        receiverId: true,
        createdAt: true,
        payer: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    }),
    prisma.task.findMany({
      where: { houseId },
      select: {
        id: true,
        title: true,
        description: true,
        karmaReward: true,
        isDone: true,
        dueDate: true,
        assigneeId: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.alert.findMany({
      where: { userId, houseId },
      orderBy: { createdAt: 'desc' },
      take: 20
    })
  ]);

  if (!house) throw new AppError('House not found', 404);

  // Calculate balances
  const balances = calculateSettlements(
    members.map(m => ({ id: m.id, name: m.name })),
    expenses.map(e => ({ 
      amount: e.amount, 
      payerId: e.payerId, 
      receiverId: e.receiverId ?? undefined,
      category: e.category ?? undefined 
    }))
  );

  return {
    house: {
      id: house.id,
      name: house.name,
      inviteCode: house.inviteCode,
      memberCount: house._count.memberships
    },
    members,
    expenses: expenses.map(e => ({
      id: e.id,
      description: e.description,
      amount: e.amount,
      payer: e.payer.name,
      date: e.createdAt,
      category: e.category
    })),
    tasks,
    alerts,
    balances
  };
};
