import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api/auth-guard'
import { ok, err, notFound, badRequest } from '@/lib/api/response'
import { db } from '@/lib/db'
import { plans, topics } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

/**
 * OPTIMIZED Single Plan API
 *
 * GET    — Plan with full topic tree (parallel: plan + topics)
 * PATCH  — Update plan fields (ownership via UPDATE WHERE)
 * DELETE — Delete plan (cascade handles topics)
 *
 * Professional patterns:
 * - Parallel queries on GET
 * - PATCH: single UPDATE with ownership in WHERE — no extra SELECT
 * - Single-pass tree builder with pre-allocated Map
 */

export const dynamic = 'force-dynamic'

interface Params {
  params: Promise<{ planId: string }>
}

// ── GET /api/plans/[planId] ──────────────────────────────────────
export async function GET(_request: Request, { params }: Params) {
  try {
    const auth = await getAuthUser()
    if (auth instanceof NextResponse) return auth
    const { userId } = auth
    const { planId } = await params

    // Parallel: plan + all topics in 2 queries
    const [[planData], allTopics] = await Promise.all([
      db
        .select()
        .from(plans)
        .where(and(eq(plans.id, planId), eq(plans.userId, userId)))
        .limit(1),

      db
        .select({
          id: topics.id,
          parentId: topics.parentId,
          title: topics.title,
          estimatedHours: topics.estimatedHours,
          status: topics.status,
          priority: topics.priority,
          scheduledDate: topics.scheduledDate,
          orderIndex: topics.orderIndex,
          notes: topics.notes,
          isWeakArea: topics.isWeakArea,
        })
        .from(topics)
        .where(eq(topics.planId, planId))
        .orderBy(topics.orderIndex),
    ])

    if (!planData) return notFound('Plan not found')

    // Single-pass tree builder
    const parents: (typeof allTopics[0] & { subtopics: typeof allTopics })[] = []
    const childMap = new Map<string, typeof allTopics>()

    let totalSub = 0
    let completedSub = 0
    let inProgressSub = 0

    for (const t of allTopics) {
      if (t.parentId === null) {
        parents.push({ ...t, subtopics: [] })
      } else {
        const list = childMap.get(t.parentId) ?? []
        list.push(t)
        childMap.set(t.parentId, list)
        totalSub++
        if (t.status === 'completed') completedSub++
        else if (t.status === 'in_progress') inProgressSub++
      }
    }

    // Attach children (already sorted by orderIndex from DB)
    for (const parent of parents) {
      parent.subtopics = childMap.get(parent.id) ?? []
    }

    return ok({
      plan: {
        id: planData.id,
        title: planData.title,
        type: planData.type,
        status: planData.status,
        startDate: planData.startDate,
        endDate: planData.endDate,
        dailyHours: planData.dailyHours,
        totalEstimatedHours: planData.totalEstimatedHours,
        color: planData.color,
        topics: parents,
        totalTopics: totalSub,
        completedTopics: completedSub,
        inProgressTopics: inProgressSub,
      },
    })
  } catch (error) {
    console.error('Plan GET error:', error)
    return err('Failed to fetch plan')
  }
}

// ── PATCH /api/plans/[planId] ────────────────────────────────────
export async function PATCH(request: Request, { params }: Params) {
  try {
    const auth = await getAuthUser()
    if (auth instanceof NextResponse) return auth
    const { userId } = auth
    const { planId } = await params
    const body = await request.json()

    // Build patch — only include provided fields
    const updateData: Record<string, unknown> = {}

    if (body.title !== undefined) updateData.title = body.title.trim()
    if (body.type !== undefined) updateData.type = body.type
    if (body.status !== undefined) updateData.status = body.status
    if (body.startDate !== undefined) updateData.startDate = body.startDate
    if (body.endDate !== undefined) updateData.endDate = body.endDate || null
    if (body.dailyHours !== undefined) updateData.dailyHours = body.dailyHours ? parseFloat(body.dailyHours) : null
    if (body.color !== undefined) updateData.color = body.color

    if (Object.keys(updateData).length === 0) return badRequest('No valid fields to update')

    // Single UPDATE with ownership in WHERE — no extra SELECT round-trip
    const [updatedPlan] = await db
      .update(plans)
      .set(updateData)
      .where(and(eq(plans.id, planId), eq(plans.userId, userId)))
      .returning()

    if (!updatedPlan) return notFound('Plan not found')

    return ok({ plan: updatedPlan }, { noCache: true })
  } catch (error) {
    console.error('Plan PATCH error:', error)
    return err('Failed to update plan')
  }
}

// ── DELETE /api/plans/[planId] ───────────────────────────────────
export async function DELETE(_request: Request, { params }: Params) {
  try {
    const auth = await getAuthUser()
    if (auth instanceof NextResponse) return auth
    const { userId } = auth
    const { planId } = await params

    // Verify ownership with minimal column
    const [existing] = await db
      .select({ id: plans.id })
      .from(plans)
      .where(and(eq(plans.id, planId), eq(plans.userId, userId)))
      .limit(1)

    if (!existing) return notFound('Plan not found')

    // Single delete — topics cascade via FK ON DELETE CASCADE
    await db.delete(plans).where(eq(plans.id, planId))

    return ok({ success: true, message: 'Plan deleted successfully' }, { noCache: true })
  } catch (error) {
    console.error('Plan DELETE error:', error)
    return err('Failed to delete plan')
  }
}
