import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { plans, users, topics as topicsTable } from '@/lib/db/schema'
import { eq, and, isNull } from 'drizzle-orm'

export async function GET(
  req: NextRequest,
  { params }: { params: { planId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user
    const user = await db.select().from(users).where(eq(users.email, session.user.email)).limit(1)
    if (!user.length) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get plan
    const [plan] = await db
      .select()
      .from(plans)
      .where(and(eq(plans.id, params.planId), eq(plans.userId, user[0].id)))
      .limit(1)

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    // Get all topics (parent topics only)
    const parentTopics = await db
      .select()
      .from(topicsTable)
      .where(and(eq(topicsTable.planId, params.planId), isNull(topicsTable.parentId)))
      .orderBy(topicsTable.orderIndex)

    // For each parent topic, get its subtopics
    const topicsWithSubtopics = await Promise.all(
      parentTopics.map(async (topic) => {
        const subtopics = await db
          .select()
          .from(topicsTable)
          .where(and(eq(topicsTable.planId, params.planId), eq(topicsTable.parentId, topic.id)))
          .orderBy(topicsTable.orderIndex)

        return {
          ...topic,
          subtopics,
        }
      })
    )

    // Calculate statistics
    const allTopics = await db
      .select()
      .from(topicsTable)
      .where(eq(topicsTable.planId, params.planId))

    const completedTopics = allTopics.filter((t) => t.status === 'completed')
    const inProgressTopics = allTopics.filter((t) => t.status === 'in_progress')

    return NextResponse.json({
      plan: {
        ...plan,
        topics: topicsWithSubtopics,
        totalTopics: allTopics.length,
        completedTopics: completedTopics.length,
        inProgressTopics: inProgressTopics.length,
      },
    })
  } catch (error) {
    console.error('Error fetching plan:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { planId: string } }
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

    const body = await req.json()
    const { status } = body

    // Update plan
    const [updatedPlan] = await db
      .update(plans)
      .set({ status })
      .where(and(eq(plans.id, params.planId), eq(plans.userId, user[0].id)))
      .returning()

    if (!updatedPlan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    return NextResponse.json({ plan: updatedPlan })
  } catch (error) {
    console.error('Error updating plan:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { planId: string } }
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

    // Delete plan (cascade will handle topics)
    await db
      .delete(plans)
      .where(and(eq(plans.id, params.planId), eq(plans.userId, user[0].id)))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting plan:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
