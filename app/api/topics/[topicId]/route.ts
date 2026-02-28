import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { topics, plans } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

/**
 * OPTIMIZED Topics API
 * 
 * PATCH: Update topic status
 * 
 * Performance optimizations:
 * 1. Single ownership verification
 * 2. Efficient status update
 * 3. Optional cascade to subtopics
 */

export const dynamic = 'force-dynamic'

interface Params {
  params: Promise<{ topicId: string }>
}

// PATCH /api/topics/[topicId] - Update topic status
export async function PATCH(request: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { topicId } = await params
    const userId = session.user.id
    const body = await request.json()

    // Verify topic exists and user owns the plan
    const topicWithPlan = await db.select({
      topic: topics,
      planUserId: plans.userId,
    })
    .from(topics)
    .innerJoin(plans, eq(topics.planId, plans.id))
    .where(eq(topics.id, topicId))
    .limit(1)

    if (topicWithPlan.length === 0) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 })
    }

    if (topicWithPlan[0].planUserId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Prepare update data
    const updateData: Record<string, any> = {}
    
    if (body.status !== undefined) {
      if (!['not_started', 'in_progress', 'completed'].includes(body.status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
      }
      updateData.status = body.status
    }
    
    if (body.scheduledDate !== undefined) {
      updateData.scheduledDate = body.scheduledDate || null
    }
    
    if (body.notes !== undefined) {
      updateData.notes = body.notes || null
    }
    
    if (body.isWeakArea !== undefined) {
      updateData.isWeakArea = body.isWeakArea
    }
    
    if (body.priority !== undefined) {
      updateData.priority = body.priority
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    // Perform update(s) in transaction if cascading to subtopics
    const cascadeToSubtopics = body.cascadeToSubtopics && body.status !== undefined

    if (cascadeToSubtopics) {
      await db.transaction(async (tx) => {
        // Update main topic
        await tx.update(topics)
          .set(updateData)
          .where(eq(topics.id, topicId))

        // Update all subtopics if this is a parent topic
        await tx.update(topics)
          .set({ status: body.status })
          .where(eq(topics.parentId, topicId))
      })
    } else {
      // Single update
      await db.update(topics)
        .set(updateData)
        .where(eq(topics.id, topicId))
    }

    // Return success immediately without fetching updated topic
    // Client uses optimistic updates, no need to return updated data
    return NextResponse.json({ 
      success: true,
      topicId,
      status: updateData.status 
    })
  } catch (error) {
    console.error('Topic PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update topic' }, { status: 500 })
  }
}

// DELETE /api/topics/[topicId] - Delete topic
export async function DELETE(request: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { topicId } = await params
    const userId = session.user.id

    // Verify topic exists and user owns the plan
    const topicWithPlan = await db.select({
      topic: topics,
      planUserId: plans.userId,
    })
    .from(topics)
    .innerJoin(plans, eq(topics.planId, plans.id))
    .where(eq(topics.id, topicId))
    .limit(1)

    if (topicWithPlan.length === 0) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 })
    }

    if (topicWithPlan[0].planUserId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Delete topic (subtopics will cascade if using proper FK constraints)
    // First delete subtopics manually if no cascade
    await db.delete(topics).where(eq(topics.parentId, topicId))
    await db.delete(topics).where(eq(topics.id, topicId))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Topic DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete topic' }, { status: 500 })
  }
}
