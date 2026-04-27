import prisma from '../lib/prisma';
import { CreateTaskInput, UpdateTaskInput } from '../schemas/task.schema';
import { AppError } from '../utils/AppError';

export const getTasks = async (houseId: string) => {
  return await prisma.task.findMany({
    where: { houseId },
    include: {
      assignee: {
        select: { id: true, name: true },
      },
    },
    orderBy: { dueDate: 'asc' },
  });
};

export const createTask = async (data: CreateTaskInput, houseId: string) => {
  return await prisma.task.create({
    data: {
      title: data.title,
      description: data.description,
      karmaReward: data.karmaReward,
      assigneeId: data.assigneeId,
      houseId,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
    },
  });
};

export const completeTask = async (taskId: string, houseId: string) => {
  // Find task and ensure it belongs to the house and is not already done
  const task = await prisma.task.findFirst({
    where: { id: taskId, houseId, isDone: false },
  });

  if (!task) {
    throw new AppError('Task not found or already completed', 404);
  }

  // ATOMIC TRANSACTION
  return await prisma.$transaction(async (tx) => {
    // 1. Mark task as done
    const updatedTask = await tx.task.update({
      where: { id: taskId },
      data: { isDone: true },
    });

    // 2. Add karma to user (if assigned)
    if (task.assigneeId) {
      // Parallel: karma update + transaction log
      await Promise.all([
        tx.user.update({
          where: { id: task.assigneeId },
          data: { karma: { increment: task.karmaReward } },
        }),
        tx.karmaTransaction.create({
          data: {
            userId: task.assigneeId,
            amount: task.karmaReward,
            reason: `Completed task: ${task.title}`,
          },
        }),
      ]);
    }

    return updatedTask;
  });
};

export const deleteTask = async (taskId: string, houseId: string) => {
  const task = await prisma.task.findFirst({
    where: { id: taskId, houseId },
  });

  if (!task) {
    throw new AppError('Task not found', 404);
  }

  return await prisma.task.delete({
    where: { id: taskId },
  });
};
