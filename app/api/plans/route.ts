import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { plans, users, topics as topicsTable } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

// Helper function to convert priority to enum value
function normalizePriority(priority: any): 'high' | 'medium' | 'low' {
  if (!priority) return 'medium'
  
  // If it's already a valid enum value
  if (priority === 'high' || priority === 'medium' || priority === 'low') {
    return priority
  }
  
  // Convert numeric values to enum (1-5 scale or 1-3 scale)
  const numPriority = typeof priority === 'string' ? parseInt(priority) : priority
  if (numPriority === 1) return 'high'
  if (numPriority === 2) return 'medium'
  if (numPriority >= 3) return 'low'  // 3, 4, 5 all map to low
  
  // Default fallback
  return 'medium'
}

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
    const { title, type, startDate, endDate, dailyHours, color, isAiGenerated, topics: topicsList } = body

    // Validate required fields
    if (!title || !type || !startDate) {
      return NextResponse.json({ error: 'Missing required fields: title, type, or startDate' }, { status: 400 })
    }

    if (!topicsList || topicsList.length === 0) {
      return NextResponse.json({ error: 'At least one topic is required' }, { status: 400 })
    }

    // Validate each topic has subtopics with valid hours
    for (let i = 0; i < topicsList.length; i++) {
      const topic = topicsList[i]
      if (!topic.subtopics || topic.subtopics.length === 0) {
        return NextResponse.json({ 
          error: `Topic "${topic.title || `Topic ${i + 1}`}" must have at least one subtopic` 
        }, { status: 400 })
      }
      
      // Validate subtopic hours
      for (let j = 0; j < topic.subtopics.length; j++) {
        const subtopic = topic.subtopics[j]
        if (!subtopic.estimatedHours || subtopic.estimatedHours <= 0) {
          return NextResponse.json({ 
            error: `Subtopic "${subtopic.title || `Subtopic ${j + 1}`}" must have hours greater than 0` 
          }, { status: 400 })
        }
      }
    }

    // Calculate total estimated hours (subtopics are parts of topics, not additional)
    const totalEstimatedHours = topicsList.reduce(
      (sum: number, topic: any) => {
        // Always count topic hours - subtopics are just breakdowns
        return sum + (topic.estimatedHours || 0)
      },
      0
    )

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

    // Create topics and subtopics
    if (topicsList && topicsList.length > 0) {
      for (let i = 0; i < topicsList.length; i++) {
        const topic = topicsList[i]
        
        // Create parent topic
        const [createdTopic] = await db.insert(topicsTable).values({
          planId: newPlan.id,
          title: topic.title,
          estimatedHours: topic.estimatedHours || 0,
          priority: normalizePriority(topic.priority),
          weightage: topic.weightage || null,
          orderIndex: i,
          status: 'not_started',
        }).returning()

        // Create subtopics if any
        if (topic.subtopics && topic.subtopics.length > 0) {
          for (let j = 0; j < topic.subtopics.length; j++) {
            const subtopic = topic.subtopics[j]
            await db.insert(topicsTable).values({
              planId: newPlan.id,
              parentId: createdTopic.id,
              title: subtopic.title,
              estimatedHours: subtopic.estimatedHours || 0,
              priority: normalizePriority(subtopic.priority),
              weightage: null,
              orderIndex: j,
              status: 'not_started',
            })
          }
        }
      }
    }

    return NextResponse.json({ plan: newPlan }, { status: 201 })
  } catch (error) {
    console.error('Error creating plan:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
