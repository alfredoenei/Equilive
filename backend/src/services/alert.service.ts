import prisma from '../lib/prisma';

export const createAlert = async (userId: string, houseId: string, type: string, message: string) => {
  return await prisma.alert.create({
    data: {
      userId,
      houseId,
      type,
      message,
    }
  });
};

export const createHouseAlerts = async (excludeUserId: string, houseId: string, type: string, message: string) => {
  const members = await prisma.houseMembership.findMany({
    where: { 
      houseId,
      userId: { not: excludeUserId }
    }
  });

  const alerts = members.map(m => ({
    userId: m.userId,
    houseId,
    type,
    message
  }));

  return await prisma.alert.createMany({
    data: alerts
  });
};

export const getUserAlerts = async (userId: string, houseId: string) => {
  return await prisma.alert.findMany({
    where: { userId, houseId },
    orderBy: { createdAt: 'desc' },
    take: 50
  });
};

export const markAllAsRead = async (userId: string, houseId: string) => {
  return await prisma.alert.updateMany({
    where: { userId, houseId, isRead: false },
    data: { isRead: true }
  });
};
