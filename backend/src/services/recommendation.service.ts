import prisma from '../lib/prisma';
import Groq from 'groq-sdk';
import { env } from '../config/env';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScoreBreakdown {
  karma: number;
  recency: number;
  workload: number;
  total: number;
}

interface MemberScore {
  userId: string;
  userName: string;
  score: ScoreBreakdown;
  joinedAt: Date;
  dominantFactor: 'karma' | 'recency' | 'workload';
}

interface RecommendationResult {
  userId: string;
  userName: string;
  score: number;
  reason: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const WEIGHT_KARMA = 0.4;
const WEIGHT_RECENCY = 0.4;
const WEIGHT_WORKLOAD = 0.2;
const RECENCY_WINDOW_DAYS = 7;
const MIN_CONTAINS_LENGTH = 5;
const GROQ_TIMEOUT_MS = 4000;

// Initialize Groq client
const groq = env.GROQ_API_KEY ? new Groq({ apiKey: env.GROQ_API_KEY }) : null;

// ─── Core Scoring (Heuristic Fallback) ────────────────────────────────────────

const calculateFairnessScore = (
  userId: string,
  context: {
    maxKarma: number;
    maxPending: number;
    allKarmas: Map<string, number>;
    allPendingCounts: Map<string, number>;
    recentTaskUserIds: Set<string>;
  }
): ScoreBreakdown => {
  const userKarma = context.allKarmas.get(userId) ?? 0;
  const karmaScore = context.maxKarma > 0 ? 1 - (userKarma / context.maxKarma) : 1;
  const recencyScore = context.recentTaskUserIds.has(userId) ? 0 : 1;
  const userPending = context.allPendingCounts.get(userId) ?? 0;
  const workloadScore = context.maxPending > 0 ? 1 - (userPending / context.maxPending) : 1;

  const total =
    karmaScore * WEIGHT_KARMA +
    recencyScore * WEIGHT_RECENCY +
    workloadScore * WEIGHT_WORKLOAD;

  return { karma: karmaScore, recency: recencyScore, workload: workloadScore, total };
};

const buildHeuristicReason = (member: MemberScore, recencyBlocked: boolean): string => {
  const parts: string[] = [];
  if (recencyBlocked) return `${member.userName} ya realizó esta tarea recientemente.`;

  if (member.dominantFactor === 'karma') {
    parts.push('es quien tiene el Karma más bajo actualmente');
  } else if (member.dominantFactor === 'recency') {
    parts.push('hace tiempo que no realiza esta tarea');
  } else {
    parts.push('es quien menos tareas pendientes tiene');
  }

  if (member.score.recency === 1 && member.dominantFactor !== 'recency') {
    parts.push('y no la ha hecho recientemente');
  }
  if (member.score.workload >= 0.8 && member.dominantFactor !== 'workload') {
    parts.push('además tiene poca carga de tareas');
  }

  return `Recomendado porque ${parts.join(', ')}.`;
};

// ─── Heuristic Implementation ────────────────────────────────────────────────

const getHeuristicRecommendation = async (
  houseId: string,
  taskTitle: string
): Promise<RecommendationResult> => {
  const memberships = await prisma.houseMembership.findMany({
    where: { houseId },
    select: {
      createdAt: true,
      user: { select: { id: true, name: true, karma: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (memberships.length === 0) {
    throw Object.assign(new Error('No hay miembros en esta casa.'), { statusCode: 400 });
  }

  const memberIds = memberships.map(m => m.user.id);
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - RECENCY_WINDOW_DAYS);

  const trimmedTitle = taskTitle.trim();
  const useContains = trimmedTitle.length >= MIN_CONTAINS_LENGTH;

  const [pendingCounts, recentTasks] = await Promise.all([
    prisma.task.groupBy({
      by: ['assigneeId'],
      where: { houseId, isDone: false, assigneeId: { in: memberIds } },
      _count: { id: true },
    }),
    prisma.task.findMany({
      where: {
        houseId,
        assigneeId: { in: memberIds },
        isDone: true,
        createdAt: { gte: cutoffDate },
        title: useContains
          ? { contains: trimmedTitle, mode: 'insensitive' }
          : { equals: trimmedTitle, mode: 'insensitive' },
      },
      select: { assigneeId: true },
      distinct: ['assigneeId'],
    }),
  ]);

  const allKarmas = new Map<string, number>();
  memberships.forEach(m => allKarmas.set(m.user.id, m.user.karma));
  const maxKarma = Math.max(...Array.from(allKarmas.values()));

  const allPendingCounts = new Map<string, number>();
  pendingCounts.forEach(p => {
    if (p.assigneeId) allPendingCounts.set(p.assigneeId, p._count.id);
  });
  const maxPending = pendingCounts.length > 0 ? Math.max(...pendingCounts.map(p => p._count.id)) : 0;

  const recentTaskUserIds = new Set<string>(
    recentTasks.map(t => t.assigneeId).filter((id): id is string => id !== null)
  );

  const context = { maxKarma, maxPending, allKarmas, allPendingCounts, recentTaskUserIds };

  const scored: MemberScore[] = memberships.map(membership => {
    const score = calculateFairnessScore(membership.user.id, context);
    const factors: Array<{ name: 'karma' | 'recency' | 'workload'; value: number }> = [
      { name: 'karma', value: score.karma * WEIGHT_KARMA },
      { name: 'recency', value: score.recency * WEIGHT_RECENCY },
      { name: 'workload', value: score.workload * WEIGHT_WORKLOAD },
    ];
    factors.sort((a, b) => b.value - a.value);

    return {
      userId: membership.user.id,
      userName: membership.user.name,
      score,
      joinedAt: membership.createdAt,
      dominantFactor: factors[0].name,
    };
  });

  scored.sort((a, b) => {
    if (b.score.total !== a.score.total) return b.score.total - a.score.total;
    return b.joinedAt.getTime() - a.joinedAt.getTime();
  });

  const winner = scored[0];
  return {
    userId: winner.userId,
    userName: winner.userName,
    score: Math.round(winner.score.total * 100) / 100,
    reason: buildHeuristicReason(winner, winner.score.recency === 0),
  };
};

// ─── Groq AI Implementation ──────────────────────────────────────────────────

const getAIRecommendation = async (
  houseId: string,
  taskTitle: string
): Promise<RecommendationResult | null> => {
  if (!groq) return null;

  const memberships = await prisma.houseMembership.findMany({
    where: { houseId },
    select: {
      user: { select: { id: true, name: true, karma: true } },
    },
  });

  const memberIds = memberships.map(m => m.user.id);
  const pendingCounts = await prisma.task.groupBy({
    by: ['assigneeId'],
    where: { houseId, isDone: false, assigneeId: { in: memberIds } },
    _count: { id: true },
  });

  const membersContext = memberships.map(m => {
    const pending = pendingCounts.find(p => p.assigneeId === m.user.id)?._count.id || 0;
    return {
      id: m.user.id,
      name: m.user.name,
      karma: m.user.karma,
      pendingTasks: pending
    };
  });

  const systemPrompt = `Actúa como un Lead de Armonía en el Hogar. Tu misión es asignar tareas de forma empática, justa y motivadora.
Responde ÚNICAMENTE en formato JSON plano: { "userId": "...", "reason": "..." }.
La razón debe ser en español, concisa (máximo 120 caracteres), empática y mencionar por qué es el mejor candidato basado en su karma o carga de trabajo.`;

  const userPrompt = `Tarea a realizar: "${taskTitle}"
Miembros de la casa: ${JSON.stringify(membersContext)}

Reglas de decisión:
1. Prioriza a quien tenga el Karma más bajo (necesita contribuir más).
2. Considera la carga de trabajo (tareas pendientes).
3. Sé motivador y empático.`;

  const timeoutPromise = new Promise<null>((_, reject) =>
    setTimeout(() => reject(new Error('Groq Timeout')), GROQ_TIMEOUT_MS)
  );

  try {
    const groqPromise = groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      model: 'llama3-8b-8192',
      response_format: { type: 'json_object' }
    });

    const completion = await Promise.race([groqPromise, timeoutPromise]);
    if (!completion) return null;

    const content = completion.choices[0]?.message?.content;
    if (!content) return null;

    const result = JSON.parse(content);
    if (!result.userId || !result.reason) return null;

    // Verify userId exists in house
    const winner = memberships.find(m => m.user.id === result.userId);
    if (!winner) return null;

    return {
      userId: winner.user.id,
      userName: winner.user.name,
      score: 1.0, // AI Score constant
      reason: result.reason
    };
  } catch (err) {
    console.warn('⚠️ [Groq AI Fallback]:', err instanceof Error ? err.message : err);
    return null;
  }
};

// ─── Public API ───────────────────────────────────────────────────────────────

export const getRecommendation = async (
  houseId: string,
  taskTitle: string
): Promise<RecommendationResult> => {
  // Plan A: Try Groq AI
  const aiResult = await getAIRecommendation(houseId, taskTitle);
  if (aiResult) return aiResult;

  // Plan B: Mathematical Heuristic Fallback
  return await getHeuristicRecommendation(houseId, taskTitle);
};
