import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { plans, users, topics as topicsTable } from '@/lib/db/schema'
import { eq, and, sql, inArray } from 'drizzle-orm'
import { withAuth, ApiErrors, CacheHeaders } from '@/lib/api-helpers'

// Helper function to convert priority to enum value
function normalizePriority(priority: any): 'highest' | 'high' | 'medium' | 'low' {
  if (!priority) return 'medium'
  
  // If it's already a valid enum value
  if (priority === 'highest' || priority === 'high' || priority === 'medium' || priority === 'low') {
    return priority
  }
  
  // Convert numeric values to enum (1-5 scale)
  const numPriority = typeof priority === 'string' ? parseInt(priority) : priority
  if (numPriority === 1) return 'highest'
  if (numPriority === 2) return 'high'
  if (numPriority === 3) return 'medium'
  if (numPriority >= 4) return 'low'  // 4, 5 map to low
  
  // Default fallback
  return 'medium'
}

export async function GET(req: NextRequest) {
  return withAuth(async (user) => {
    // Get all plans for user
    const userPlans = await db
      .select()
      .from(plans)
      .where(eq(plans.userId, user.id))
      .orderBy(plans.createdAt)

    // Early return if no plans
    if (userPlans.length === 0) {
      return NextResponse.json({ plans: [] }, { headers: CacheHeaders.medium })
    }

    // OPTIMIZATION: Fetch ALL topics in ONE query instead of N queries
    const allTopics = await db
      .select({
        planId: topicsTable.planId,
        status: topicsTable.status,
      })
      .from(topicsTable)
      .where(
        inArray(
          topicsTable.planId,
          userPlans.map((p) => p.id)
        )
      )

    // Build topic counts map in memory (fast!)
    const topicCounts = new Map<string, { total: number; completed: number }>()
    allTopics.forEach((topic) => {
      const current = topicCounts.get(topic.planId) || { total: 0, completed: 0 }
      current.total++
      if (topic.status === 'completed') {
        current.completed++
      }
      topicCounts.set(topic.planId, current)
    })

    // Attach counts to plans
    const plansWithCounts = userPlans.map((plan) => {
      const counts = topicCounts.get(plan.id) || { total: 0, completed: 0 }
      return {
        ...plan,
        totalTopics: counts.total,
        completedTopics: counts.completed,
      }
    })

    return NextResponse.json({ plans: plansWithCounts }, { headers: CacheHeaders.medium })
  })
}

export async function POST(req: NextRequest) {
  return withAuth(async (user) => {
    const body = await req.json()
    const { title, type, startDate, endDate, dailyHours, color, isAiGenerated, topics: topicsList } = body

    // Validate required fields
    if (!title || !type || !startDate) {
      return ApiErrors.badRequest('Missing required fields: title, type, or startDate')
    }

    if (!topicsList || topicsList.length === 0) {
      return ApiErrors.badRequest('At least one topic is required')
    }

    // Validate each topic has subtopics with valid hours
    for (let i = 0; i < topicsList.length; i++) {
      const topic = topicsList[i]
      if (!topic.subtopics || topic.subtopics.length === 0) {
        return ApiErrors.badRequest(`Topic "${topic.title || `Topic ${i + 1}`}" must have at least one subtopic`)
      }
      
      // Validate subtopic hours
      for (let j = 0; j < topic.subtopics.length; j++) {
        const subtopic = topic.subtopics[j]
        if (!subtopic.estimatedHours || subtopic.estimatedHours <= 0) {
          return ApiErrors.badRequest(`Subtopic "${subtopic.title || `Subtopic ${j + 1}`}" must have hours greater than 0`)
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
        userId: user.id,
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

    // OPTIMIZATION: Prepare all topic inserts for batch operation
    const topicInserts: any[] = []
    const subtopicInserts: any[] = []

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

      // Prepare subtopics if any
      if (topic.subtopics && topic.subtopics.length > 0) {
        for (let j = 0; j < topic.subtopics.length; j++) {
          const subtopic = topic.subtopics[j]
          subtopicInserts.push({
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

    // Batch insert all subtopics at once (much faster!)
    if (subtopicInserts.length > 0) {
      await db.insert(topicsTable).values(subtopicInserts)
    }

    return NextResponse.json({ plan: newPlan }, { status: 201 })
  })
}