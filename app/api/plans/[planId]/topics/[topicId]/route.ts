import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { topics as topicsTable, plans, users } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { withAuth, ApiErrors } from '@/lib/api-helpers'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { planId: string; topicId: string } }
) {
  return withAuth(async (user) => {
    // Verify plan belongs to user
    const [plan] = await db
      .select()
      .from(plans)
      .where(and(eq(plans.id, params.planId), eq(plans.userId, user.id)))
      .limit(1)

    if (!plan) {
      return ApiErrors.notFound('Plan')
    }

    const body = await req.json()
    const { status, scheduledDate, title, estimatedHours, priority, notes } = body

    // Build update object
    const updateData: any = {}
    
    if (status !== undefined) {
      if (!['not_started', 'in_progress', 'completed'].includes(status)) {
        return ApiErrors.badRequest('Invalid status')
      }
      updateData.status = status
    }
    
    if (scheduledDate !== undefined) updateData.scheduledDate = scheduledDate
    if (title !== undefined) updateData.title = title
    if (estimatedHours !== undefined) updateData.estimatedHours = estimatedHours
    
    if (priority !== undefined) {
      if (!['high', 'medium', 'low'].includes(priority)) {
        return ApiErrors.badRequest('Invalid priority')
      }
      updateData.priority = priority
    }
    
    if (notes !== undefined) updateData.notes = notes

    if (Object.keys(updateData).length === 0) {
      return ApiErrors.badRequest('No fields to update')
    }

    // Update topic
    const [updatedTopic] = await db
      .update(topicsTable)
      .set(updateData)
      .where(and(eq(topicsTable.id, params.topicId), eq(topicsTable.planId, params.planId)))
      .returning()

    if (!updatedTopic) {
      return ApiErrors.notFound('Topic')
    }

    return NextResponse.json({ topic: updatedTopic })
  })
}
