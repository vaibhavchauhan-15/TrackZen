import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api/auth-guard'
import { ok, err, notFound, forbidden, badRequest } from '@/lib/api/response'
import { db } from '@/lib/db'
import { topics, plans } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

/**
 * OPTIMIZED Topics API
 *
 * PATCH  — Update topic status/fields
 * DELETE — Delete topic + subtopics (transaction)
 *
 * Professional patterns:
 * - Ownership check via JOIN (1 query instead of 2)
 * - Transaction for cascade delete (parent + children)
 * - Lean success response (client uses optimistic updates)
 */

export const dynamic = 'force-dynamic'

interface Params {
  params: Promise<{ topicId: string }>
}

// ── PATCH /api/topics/[topicId] ──────────────────────────────────
export async function PATCH(request: Request, { params }: Params) {
  try {
    const auth = await getAuthUser()
    if (auth instanceof NextResponse) return auth
    const { userId } = auth
    const { topicId } = await params
    const body = await request.json()

    // Single JOIN: topic existence + ownership
    const [topicRow] = await db
      .select({ topicId: topics.id, planUserId: plans.userId })
      .from(topics)
      .innerJoin(plans, eq(topics.planId, plans.id))
      .where(eq(topics.id, topicId))
      .limit(1)

    if (!topicRow) return notFound('Topic not found')
    if (topicRow.planUserId !== userId) return forbidden('Unauthorized')

    // Build update data
    const updateData: Record<string, unknown> = {}

    if (body.status !== undefined) {
      if (!['not_started', 'in_progress', 'completed'].includes(body.status)) {
        return badRequest('Invalid status')
      }
      updateData.status = body.status
    }
    if (body.scheduledDate !== undefined) updateData.scheduledDate = body.scheduledDate || null
    if (body.notes !== undefined) updateData.notes = body.notes || null
    if (body.isWeakArea !== undefined) updateData.isWeakArea = body.isWeakArea
    if (body.priority !== undefined) updateData.priority = body.priority

    if (Object.keys(updateData).length === 0) return badRequest('No valid fields to update')

    // Cascade to subtopics if requested
    if (body.cascadeToSubtopics && body.status !== undefined) {
      await db.transaction(async tx => {
        await tx.update(topics).set(updateData).where(eq(topics.id, topicId))
        await tx.update(topics).set({ status: body.status }).where(eq(topics.parentId, topicId))
      })
    } else {
      await db.update(topics).set(updateData).where(eq(topics.id, topicId))
    }

    // Lean response — client uses optimistic updates
    return ok({ success: true, topicId, status: updateData.status }, { noCache: true })
  } catch (error) {
    console.error('Topic PATCH error:', error)
    return err('Failed to update topic')
  }
}

// ── DELETE /api/topics/[topicId] ─────────────────────────────────
export async function DELETE(_request: Request, { params }: Params) {
  try {
    const auth = await getAuthUser()
    if (auth instanceof NextResponse) return auth
    const { userId } = auth
    const { topicId } = await params

    // Ownership check
    const [topicRow] = await db
      .select({ topicId: topics.id, planUserId: plans.userId })
      .from(topics)
      .innerJoin(plans, eq(topics.planId, plans.id))
      .where(eq(topics.id, topicId))
      .limit(1)

    if (!topicRow) return notFound('Topic not found')
    if (topicRow.planUserId !== userId) return forbidden('Unauthorized')

    // Atomic delete: subtopics first, then parent
    await db.transaction(async tx => {
      await tx.delete(topics).where(eq(topics.parentId, topicId))
      await tx.delete(topics).where(eq(topics.id, topicId))
    })

    return ok({ success: true }, { noCache: true })
  } catch (error) {
    console.error('Topic DELETE error:', error)
    return err('Failed to delete topic')
  }
}
