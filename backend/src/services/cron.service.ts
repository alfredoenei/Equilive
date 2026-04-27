import cron from 'node-cron';
import prisma from '../lib/prisma';

export const initCronJobs = () => {
  // Every day at midnight for task penalties
  cron.schedule('0 0 * * *', async () => {
    console.log('⏰ Running midnight penalty check...');
    await checkOverdueTasks();
  });

  // Every hour for alert penalties
  cron.schedule('0 * * * *', async () => {
    console.log('🚨 Checking for expired emergency alerts...');
    await checkExpiredAlerts();
  });
};

export const checkOverdueTasks = async () => {
  const now = new Date();
  const overdueTasks = await prisma.task.findMany({
    where: { isDone: false, dueDate: { lt: now } },
  });

  for (const task of overdueTasks) {
    if (!task.assigneeId) continue;
    try {
      await prisma.$transaction(async (tx) => {
        const assigneeId = task.assigneeId as string;
        await tx.user.update({
          where: { id: assigneeId },
          data: { karma: { decrement: 10 } },
        });
        await tx.karmaTransaction.create({
          data: {
            userId: assigneeId,
            amount: -10,
            reason: `Penalty: Overdue task "${task.title}"`,
          },
        });
      });
    } catch (error) {
      console.error(`Failed to penalize user for task ${task.id}:`, error);
    }
  }
};

export const checkExpiredAlerts = async () => {
  const now = new Date();
  const expiredAlerts = await prisma.activeAlert.findMany({
    where: { resolved: false, expiresAt: { lt: now } },
    include: { 
      house: { 
        include: { 
          memberships: { 
            include: { 
              user: true 
            } 
          } 
        } 
      } 
    }
  });

  for (const alert of expiredAlerts) {
    try {
      // In a real app, we might penalize only specific people, 
      // but here we'll penalize all users in the house EXCEPT the creator
      // to "punish" the house for not helping.
      const usersToPenalize = alert.house.memberships
        .map(m => m.user)
        .filter(u => u.id !== alert.creatorId);

      await prisma.$transaction(async (tx) => {
        for (const user of usersToPenalize) {
          await tx.user.update({
            where: { id: user.id },
            data: { karma: { decrement: 15 } },
          });
          await tx.karmaTransaction.create({
            data: {
              userId: user.id,
              amount: -15,
              reason: `Penalty: Unresolved emergency "${alert.type}"`,
            },
          });
        }
        // Mark as resolved to avoid double penalty
        await tx.activeAlert.update({
          where: { id: alert.id },
          data: { resolved: true },
        });
      });
      console.log(`Penalized house ${alert.houseId} for alert ${alert.id}`);
    } catch (error) {
      console.error(`Failed to penalize alert ${alert.id}:`, error);
    }
  }
};
