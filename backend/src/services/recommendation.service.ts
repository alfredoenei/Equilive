import prisma from '../lib/prisma';

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

// ─── Core Scoring (Pure — no DB calls) ────────────────────────────────────────

/**
 * Calculate the fairness score for a single user. All data is pre-fetched.
 */
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
  // ── Karma Score ──
  const userKarma = context.allKarmas.get(userId) ?? 0;
  const karmaScore = context.maxKarma > 0
    ? 1 - (userKarma / context.maxKarma)
    : 1;

  // ── Recency Score ──
  const recencyScore = context.recentTaskUserIds.has(userId) ? 0 : 1;

  // ── Workload Score ──
  const userPending = context.allPendingCounts.get(userId) ?? 0;
  const workloadScore = context.maxPending > 0
    ? 1 - (userPending / context.maxPending)
    : 1;

  const total =
    karmaScore * WEIGHT_KARMA +
    recencyScore * WEIGHT_RECENCY +
    workloadScore * WEIGHT_WORKLOAD;

  return { karma: karmaScore, recency: recencyScore, workload: workloadScore, total };
};

// ─── Reason Builder (Conversational Spanish) ──────────────────────────────────

const buildReason = (member: MemberScore, recencyBlocked: boolean): string => {
  const parts: string[] = [];

  if (recencyBlocked) {
    return `${member.userName} ya realizó esta tarea recientemente.`;
  }

  // Determine dominant factor and build a friendly explanation
  if (member.dominantFactor === 'karma') {
    parts.push('es quien tiene el Karma más bajo actualmente');
  } else if (member.dominantFactor === 'recency') {
    parts.push('hace tiempo que no realiza esta tarea');
  } else {
    parts.push('es quien menos tareas pendientes tiene');
  }

  // Add secondary insights
  if (member.score.recency === 1 && member.dominantFactor !== 'recency') {
    parts.push('y no la ha hecho recientemente');
  }

  if (member.score.workload >= 0.8 && member.dominantFactor !== 'workload') {
    parts.push('además tiene poca carga de tareas');
  }

  return `Recomendado porque ${parts.join(', ')}.`;
};

// ─── Public API ───────────────────────────────────────────────────────────────

export const getRecommendation = async (
  houseId: string,
  taskTitle: string
): Promise<RecommendationResult> => {
  // 1. Get all house members with their karma and join date
  const memberships = await prisma.houseMembership.findMany({
    where: { houseId },
    select: {
      createdAt: true,
      user: {
        select: { id: true, name: true, karma: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (memberships.length === 0) {
    throw Object.assign(new Error('No hay miembros en esta casa.'), { statusCode: 400 });
  }

  const memberIds = memberships.map(m => m.user.id);

  // 2. Pre-compute ALL context in parallel (eliminates N+1)
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - RECENCY_WINDOW_DAYS);

  const trimmedTitle = taskTitle.trim();
  const useContains = trimmedTitle.length >= MIN_CONTAINS_LENGTH;

  const [pendingCounts, recentTasks] = await Promise.all([
    // Batch: pending task counts for all members
    prisma.task.groupBy({
      by: ['assigneeId'],
      where: {
        houseId,
        isDone: false,
        assigneeId: { in: memberIds },
      },
      _count: { id: true },
    }),
    // Batch: recency check for ALL members at once (single query replaces N queries)
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

  // Build context maps
  const allKarmas = new Map<string, number>();
  memberships.forEach(m => allKarmas.set(m.user.id, m.user.karma));
  const maxKarma = Math.max(...Array.from(allKarmas.values()));

  const allPendingCounts = new Map<string, number>();
  pendingCounts.forEach(p => {
    if (p.assigneeId) {
      allPendingCounts.set(p.assigneeId, p._count.id);
    }
  });
  const maxPending = pendingCounts.length > 0
    ? Math.max(...pendingCounts.map(p => p._count.id))
    : 0;

  const recentTaskUserIds = new Set<string>(
    recentTasks.map(t => t.assigneeId).filter((id): id is string => id !== null)
  );

  const context = { maxKarma, maxPending, allKarmas, allPendingCounts, recentTaskUserIds };

  // 3. Score every member (now fully synchronous — zero DB calls)
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

  // 4. Sort: highest total first, then newest membership (tiebreaker)
  scored.sort((a, b) => {
    if (b.score.total !== a.score.total) {
      return b.score.total - a.score.total;
    }
    return b.joinedAt.getTime() - a.joinedAt.getTime();
  });

  const winner = scored[0];

  return {
    userId: winner.userId,
    userName: winner.userName,
    score: Math.round(winner.score.total * 100) / 100,
    reason: buildReason(winner, winner.score.recency === 0),
  };
};
