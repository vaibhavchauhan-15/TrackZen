import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { plans, topics } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

/**
 * Single Plan API
 *
 * GET: Get plan with full topics tree
 * PATCH: Update plan status/details
 * DELETE: Delete plan (cascades to topics)
 */

export const dynamic = 'force-dynamic'

interface Params {
  params: Promise<{ planId: string }>
}

// GET /api/plans/[planId] - Get plan with topics
export async function GET(request: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { planId } = await params
    const userId = session.user.id

    // Verify plan ownership and get plan data
    const [planData] = await db.select()
      .from(plans)
      .where(and(
        eq(plans.id, planId),
        eq(plans.userId, userId)
      ))
      .limit(1)

    if (!planData) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    // Get all topics for this plan
    const allTopics = await db.select({
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
      .orderBy(topics.orderIndex)

    // Build topic tree (parent topics with subtopics)
    const parentTopics = allTopics.filter(t => t.parentId === null)
    const subtopicsMap = new Map<string, typeof allTopics>()

    allTopics.filter(t => t.parentId !== null).forEach(topic => {
      const parentSubtopics = subtopicsMap.get(topic.parentId!) || []
      parentSubtopics.push(topic)
      subtopicsMap.set(topic.parentId!, parentSubtopics)
    })

    const topicsTree = parentTopics.map(parent => ({
      ...parent,
      subtopics: (subtopicsMap.get(parent.id) || []).sort((a, b) => a.orderIndex - b.orderIndex),
    }))

    // Calculate topic statistics
    const subtopics = allTopics.filter(t => t.parentId !== null)
    const completedSubtopics = subtopics.filter(t => t.status === 'completed')
    const inProgressSubtopics = subtopics.filter(t => t.status === 'in_progress')

    const response = {
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
        topics: topicsTree,
        totalTopics: subtopics.length,
        completedTopics: completedSubtopics.length,
        inProgressTopics: inProgressSubtopics.length,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Plan GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch plan' }, { status: 500 })
  }
}

// PATCH /api/plans/[planId] - Update plan
export async function PATCH(request: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { planId } = await params
    const userId = session.user.id
    const body = await request.json()

    // Verify ownership
    const [existingPlan] = await db.select({ id: plans.id })
      .from(plans)
      .where(and(eq(plans.id, planId), eq(plans.userId, userId)))
      .limit(1)

    if (!existingPlan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    // Prepare update data
    const updateData: Record<string, any> = {}

    if (body.title !== undefined) updateData.title = body.title.trim()
    if (body.type !== undefined) updateData.type = body.type
    if (body.status !== undefined) updateData.status = body.status
    if (body.startDate !== undefined) updateData.startDate = body.startDate
    if (body.endDate !== undefined) updateData.endDate = body.endDate || null
    if (body.dailyHours !== undefined) updateData.dailyHours = body.dailyHours ? parseFloat(body.dailyHours) : null
    if (body.color !== undefined) updateData.color = body.color

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    // Update plan
    const [updatedPlan] = await db.update(plans)
      .set(updateData)
      .where(eq(plans.id, planId))
      .returning()

    return NextResponse.json({ plan: updatedPlan })
  } catch (error) {
    console.error('Plan PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 })
  }
}

// DELETE /api/plans/[planId] - Delete plan
export async function DELETE(request: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { planId } = await params
    const userId = session.user.id

    // Verify ownership
    const [existingPlan] = await db.select({ id: plans.id })
      .from(plans)
      .where(and(eq(plans.id, planId), eq(plans.userId, userId)))
      .limit(1)

    if (!existingPlan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    // Delete plan (topics cascade automatically due to ON DELETE CASCADE)
    await db.delete(plans).where(eq(plans.id, planId))

    return NextResponse.json({ success: true, message: 'Plan deleted successfully' })
  } catch (error) {
    console.error('Plan DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete plan' }, { status: 500 })
  }
}
