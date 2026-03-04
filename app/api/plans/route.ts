import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api/auth-guard'
import { ok, err, badRequest } from '@/lib/api/response'
import { db } from '@/lib/db'
import { plans, topics } from '@/lib/db/schema'
import { eq, and, sql, desc, inArray } from 'drizzle-orm'

/**
 * OPTIMIZED Plans API
 *
 * GET  — List all plans with aggregated topic counts
 * POST — Create plan with topics (batch insert in transaction)
 *
 * Professional patterns:
 * - Single aggregate query for topic counts (no N+1)
 * - Batch insert for topics & subtopics
 * - Transaction for atomic plan creation
 * - Early return when zero plans
 */

export const dynamic = 'force-dynamic'

// ── GET /api/plans ───────────────────────────────────────────────
export async function GET() {
  try {
    const auth = await getAuthUser()
    if (auth instanceof NextResponse) return auth
    const { userId } = auth

    // Fetch plans with selective projection
    const userPlans = await db
      .select({
        id: plans.id,
        title: plans.title,
        type: plans.type,
        status: plans.status,
        startDate: plans.startDate,
        endDate: plans.endDate,
        dailyHours: plans.dailyHours,
        totalEstimatedHours: plans.totalEstimatedHours,
        color: plans.color,
        isAiGenerated: plans.isAiGenerated,
        createdAt: plans.createdAt,
      })
      .from(plans)
      .where(eq(plans.userId, userId))
      .orderBy(desc(plans.createdAt))

    if (userPlans.length === 0) return ok({ plans: [] })

    // Single aggregate query for all topic counts
    const planIds = userPlans.map(p => p.id)
    const topicCounts = await db
      .select({
        planId: topics.planId,
        total: sql<number>`COUNT(*)`.as('total'),
        completed: sql<number>`SUM(CASE WHEN ${topics.status} = 'completed' THEN 1 ELSE 0 END)`.as('completed'),
      })
      .from(topics)
      .where(and(inArray(topics.planId, planIds), sql`${topics.parentId} IS NOT NULL`))
      .groupBy(topics.planId)

    // O(1) lookup
    const countsMap = new Map(topicCounts.map(tc => [tc.planId, tc]))

    const plansWithCounts = userPlans.map(plan => {
      const c = countsMap.get(plan.id)
      return {
        ...plan,
        totalTopics: Number(c?.total ?? 0),
        completedTopics: Number(c?.completed ?? 0),
      }
    })

    return ok({ plans: plansWithCounts })
  } catch (error) {
    console.error('Plans GET error:', error)
    return err('Failed to fetch plans')
  }
}

// ── POST /api/plans ──────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const auth = await getAuthUser()
    if (auth instanceof NextResponse) return auth
    const { userId } = auth

    const body = await request.json()
    const { title, type, startDate, endDate, dailyHours, color, isAiGenerated, topics: inputTopics } = body

    // Validation
    if (!title?.trim()) return badRequest('Plan title is required')
    if (!startDate) return badRequest('Start date is required')
    if (!inputTopics || inputTopics.length === 0) return badRequest('At least one topic is required')

    // Pre-calculate total hours
    let totalEstimatedHours = 0
    for (const topic of inputTopics) {
      if (topic.subtopics?.length) {
        for (const st of topic.subtopics) {
          totalEstimatedHours += st.estimatedHours || 0
        }
      }
    }

    // Atomic transaction: plan + topics + subtopics
    const result = await db.transaction(async tx => {
      const [newPlan] = await tx
        .insert(plans)
        .values({
          userId,
          title: title.trim(),
          type: type || 'custom',
          startDate,
          endDate: endDate || null,
          dailyHours: dailyHours ? parseFloat(dailyHours) : null,
          totalEstimatedHours,
          color: color || '#7C3AED',
          isAiGenerated: isAiGenerated || false,
          status: 'active',
        })
        .returning()

      // Prepare batch arrays
      const topicsToInsert: any[] = []
      const subtopicsToInsert: any[] = []

      for (let i = 0; i < inputTopics.length; i++) {
        const topic = inputTopics[i]
        const topicId = crypto.randomUUID()
        const subs = topic.subtopics || []
        const topicHours = subs.reduce((sum: number, st: any) => sum + (st.estimatedHours || 0), 0)

        topicsToInsert.push({
          id: topicId,
          planId: newPlan.id,
          parentId: null,
          title: topic.title,
          estimatedHours: topicHours,
          priority: mapPriority(topic.priority),
          weightage: topic.weightage || null,
          scheduledDate: null,
          orderIndex: i,
          status: 'not_started',
          notes: null,
          isWeakArea: false,
        })

        for (let j = 0; j < subs.length; j++) {
          subtopicsToInsert.push({
            id: crypto.randomUUID(),
            planId: newPlan.id,
            parentId: topicId,
            title: subs[j].title,
            estimatedHours: subs[j].estimatedHours || 0,
            priority: mapPriority(subs[j].priority),
            weightage: null,
            scheduledDate: null,
            orderIndex: j,
            status: 'not_started',
            notes: null,
            isWeakArea: false,
          })
        }
      }

      // Batch inserts — one round-trip each
      if (topicsToInsert.length > 0) await tx.insert(topics).values(topicsToInsert)
      if (subtopicsToInsert.length > 0) await tx.insert(topics).values(subtopicsToInsert)

      return { plan: newPlan, topicsCount: topicsToInsert.length, subtopicsCount: subtopicsToInsert.length }
    })

    return ok(
      {
        plan: result.plan,
        message: `Plan created with ${result.topicsCount} topics and ${result.subtopicsCount} subtopics`,
      },
      { status: 201, noCache: true },
    )
  } catch (error) {
    console.error('Plans POST error:', error)
    return err('Failed to create plan')
  }
}

// ── Helpers ──────────────────────────────────────────────────────

function mapPriority(priority: number | string | undefined): 'highest' | 'high' | 'medium' | 'low' {
  if (typeof priority === 'string' && ['highest', 'high', 'medium', 'low'].includes(priority)) {
    return priority as 'highest' | 'high' | 'medium' | 'low'
  }
  if (typeof priority === 'number') {
    if (priority === 1) return 'highest'
    if (priority === 2) return 'high'
    if (priority === 3) return 'medium'
    if (priority >= 4) return 'low'
  }
  return 'medium'
}
