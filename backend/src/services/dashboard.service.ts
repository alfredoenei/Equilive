import prisma from '../lib/prisma';

interface DashboardExpense {
  id: string;
  description: string;
  amount: number;
  createdAt: Date;
  payer: { name: string };
}

export const getDashboardData = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      karma: true,
      activeHouseId: true,
      tasks: {
        where: { isDone: false },
        take: 3,
        orderBy: { dueDate: 'asc' },
        select: {
          id: true,
          title: true,
          dueDate: true,
          karmaReward: true,
        }
      }
    }
  });

  if (!user) throw new Error('User not found');

  let houseData = null;
  let recentExpenses: DashboardExpense[] = [];

  if (user.activeHouseId) {
    // Parallel fetch: house data + recent expenses
    const [house, expenses] = await Promise.all([
      prisma.house.findUnique({
        where: { id: user.activeHouseId },
        select: {
          id: true,
          name: true,
          inviteCode: true,
          _count: { select: { memberships: true } }
        }
      }),
      prisma.expense.findMany({
        where: { houseId: user.activeHouseId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          description: true,
          amount: true,
          createdAt: true,
          payer: { select: { name: true } }
        }
      })
    ]);

    houseData = house;
    recentExpenses = expenses;
  }

  return {
    user: {
      name: user.name,
      karma: user.karma,
    },
    house: houseData ? {
      id: houseData.id,
      name: houseData.name,
      inviteCode: houseData.inviteCode,
      memberCount: houseData._count.memberships
    } : null,
    pendingTasks: user.tasks.map(t => ({
      id: t.id,
      title: t.title,
      dueDate: t.dueDate,
      karmaReward: t.karmaReward
    })),
    recentExpenses: recentExpenses.map(e => ({
      id: e.id,
      description: e.description,
      amount: e.amount,
      payer: e.payer.name,
      date: e.createdAt
    }))
  };
};
