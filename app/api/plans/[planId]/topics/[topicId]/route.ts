import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { topics as topicsTable, plans, users } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { planId: string; topicId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db.select().from(users).where(eq(users.email, session.user.email)).limit(1)
    if (!user.length) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify plan belongs to user
    const [plan] = await db
      .select()
      .from(plans)
      .where(and(eq(plans.id, params.planId), eq(plans.userId, user[0].id)))
      .limit(1)

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    const body = await req.json()
    const { status, scheduledDate, title, estimatedHours, priority, notes } = body

    // Build update object
    const updateData: any = {}
    
    if (status !== undefined) {
      if (!['not_started', 'in_progress', 'completed'].includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
      }
      updateData.status = status
    }
    
    if (scheduledDate !== undefined) {
      updateData.scheduledDate = scheduledDate
    }
    
    if (title !== undefined) {
      updateData.title = title
    }
    
    if (estimatedHours !== undefined) {
      updateData.estimatedHours = estimatedHours
    }
    
    if (priority !== undefined) {
      if (!['high', 'medium', 'low'].includes(priority)) {
        return NextResponse.json({ error: 'Invalid priority' }, { status: 400 })
      }
      updateData.priority = priority
    }
    
    if (notes !== undefined) {
      updateData.notes = notes
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    // Update topic
    const [updatedTopic] = await db
      .update(topicsTable)
      .set(updateData)
      .where(and(eq(topicsTable.id, params.topicId), eq(topicsTable.planId, params.planId)))
      .returning()

    if (!updatedTopic) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 })
    }

    return NextResponse.json({ topic: updatedTopic })
  } catch (error) {
    console.error('Error updating topic:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
