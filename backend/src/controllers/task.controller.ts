import { Request, Response } from 'express';
import * as taskService from '@/services/task.service';
import * as recommendationService from '@/services/recommendation.service';
import { createTaskSchema } from '@/schemas/task.schema';
import { asyncHandler } from '@/utils/asyncHandler';
import { emitToHouse } from '@/lib/socket';
import * as alertService from '@/services/alert.service';
import prisma from '@/lib/prisma';

export const getTasks = asyncHandler(async (req: Request, res: Response) => {
  const houseId = req.user!.houseId!;
  const tasks = await taskService.getTasks(houseId);
  res.json({ success: true, data: tasks });
});

export const createTask = asyncHandler(async (req: Request, res: Response) => {
  const houseId = req.user!.houseId!;
  const validatedData = createTaskSchema.parse(req.body);
  const task = await taskService.createTask(validatedData, houseId);
  
  // Real-time update
  emitToHouse(houseId, 'task_updated', task);

  // Persistent Alert
  if (task.assigneeId) {
    await alertService.createAlert(
      task.assigneeId,
      houseId,
      'TASK',
      `Se te ha asignado una nueva tarea: ${task.title}`
    );
  } else {
    await alertService.createHouseAlerts(
      req.user!.id,
      houseId,
      'TASK',
      `Nueva tarea disponible: ${task.title}`
    );
  }

  res.status(201).json({ success: true, data: task });
});

export const completeTask = asyncHandler(async (req: Request, res: Response) => {
  const houseId = req.user!.houseId!;
  const id = req.params.id as string;
  const task = await taskService.completeTask(id, houseId);
  
  // Real-time update
  emitToHouse(houseId, 'task_updated', task);

  // Persistent Alert
  const user = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { name: true } });
  await alertService.createHouseAlerts(
    req.user!.id,
    houseId,
    'TASK',
    `${user?.name} ha completado la tarea: ${task.title}`
  );

  res.json({ success: true, data: task });
});

export const deleteTask = asyncHandler(async (req: Request, res: Response) => {
  const houseId = req.user!.houseId!;
  const id = req.params.id as string;
  await taskService.deleteTask(id, houseId);
  
  // Real-time update
  emitToHouse(houseId, 'task_updated', { id, deleted: true });

  res.status(200).json({ success: true, message: 'Task deleted successfully' });
});

export const recommendAssignee = asyncHandler(async (req: Request, res: Response) => {
  const houseId = req.user!.houseId!;
  const title = req.query.title as string | undefined;

  if (!title || title.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'El parámetro "title" es obligatorio.',
    });
  }

  const recommendation = await recommendationService.getRecommendation(houseId, title.trim());
  res.json({ success: true, data: recommendation });
});
