import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { plans, users, topics as topicsTable } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

export async function GET(req: NextRequest) {
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

    // Get all plans for user
    const userPlans = await db
      .select()
      .from(plans)
      .where(eq(plans.userId, user[0].id))
      .orderBy(plans.createdAt)

    // Get topics count for each plan
    const plansWithCounts = await Promise.all(
      userPlans.map(async (plan) => {
        const allTopics = await db
          .select()
          .from(topicsTable)
          .where(eq(topicsTable.planId, plan.id))

        const completedTopics = allTopics.filter((t) => t.status === 'completed')

        return {
          ...plan,
          totalTopics: allTopics.length,
          completedTopics: completedTopics.length,
        }
      })
    )

    return NextResponse.json({ plans: plansWithCounts })
  } catch (error) {
    console.error('Error fetching plans:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
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
    const { title, type, startDate, endDate, dailyHours, color, isAiGenerated, topics } = body

    // Calculate total estimated hours
    const totalEstimatedHours = topics?.reduce(
      (sum: number, topic: any) => sum + (topic.estimatedHours || 0),
      0
    ) || 0

    // Create plan
    const [newPlan] = await db
      .insert(plans)
      .values({
        userId: user[0].id,
        title,
        type,
        startDate,
        endDate: endDate || null,
        dailyHours: dailyHours ? parseFloat(dailyHours) : null,
        totalEstimatedHours,
        color: color || '#7C3AED',
        isAiGenerated: isAiGenerated || false,
        status: 'active',
      })
      .returning()

    // Create topics if provided
    if (topics && topics.length > 0) {
      for (const topic of topics) {
        await db.insert(topicsTable).values({
          planId: newPlan.id,
          title: topic.title,
          estimatedHours: topic.estimatedHours || 0,
          priority: topic.priority || 3,
          weightage: topic.weightage || null,
          orderIndex: topic.orderIndex || 0,
          status: 'not_started',
        })
      }
    }

    return NextResponse.json({ plan: newPlan }, { status: 201 })
  } catch (error) {
    console.error('Error creating plan:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
