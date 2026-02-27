import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { plans, topics } from '@/lib/db/schema'
import { eq, and, sql, desc, inArray } from 'drizzle-orm'

/**
 * OPTIMIZED Plans API
 * 
 * GET: List all plans with topic counts
 * POST: Create new plan with topics (batch insert)
 * 
 * Performance optimizations:
 * 1. Single query with aggregated topic counts  
 * 2. Batch insert for topics
 * 3. Transaction for atomicity
 * 4. Selective column fetching
 */

export const dynamic = 'force-dynamic'

// GET /api/plans - List all user's plans
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Get plans
    const userPlans = await db.select({
      id: plans.id,
      title: plans.title,
      type: plans.type,
      status: plans.status,
      startDate: plans.startDate,
      endDate: plans.endDate,
      dailyHours: plans.dailyHours,
      totalEstimatedHours: plans.totalEstimatedHours,
      color: plans.color,
      isAiGenerated: plans.isAiGenerated,
      createdAt: plans.createdAt,
    })
    .from(plans)
    .where(eq(plans.userId, userId))
    .orderBy(desc(plans.createdAt))

    if (userPlans.length === 0) {
      return NextResponse.json({ plans: [] })
    }

    // Get topic counts in single query
    const planIds = userPlans.map(p => p.id)
    const topicCounts = await db.select({
      planId: topics.planId,
      total: sql<number>`COUNT(*)`.as('total'),
      completed: sql<number>`SUM(CASE WHEN ${topics.status} = 'completed' THEN 1 ELSE 0 END)`.as('completed'),
    })
    .from(topics)
    .where(and(
      inArray(topics.planId, planIds),
      sql`${topics.parentId} IS NOT NULL`
    ))
    .groupBy(topics.planId)

    // Map counts to plans
    const countsMap = new Map(topicCounts.map(tc => [tc.planId, { total: tc.total, completed: tc.completed }]))

    const plansWithCounts = userPlans.map(plan => {
      const counts = countsMap.get(plan.id) || { total: 0, completed: 0 }
      return {
        ...plan,
        totalTopics: counts.total,
        completedTopics: counts.completed,
      }
    })

    return NextResponse.json({ plans: plansWithCounts })
  } catch (error) {
    console.error('Plans GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 })
  }
}

// POST /api/plans - Create new plan with topics
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const body = await request.json()
    
    const { title, type, startDate, endDate, dailyHours, color, isAiGenerated, topics: inputTopics } = body

    // Validation
    if (!title?.trim()) {
      return NextResponse.json({ error: 'Plan title is required' }, { status: 400 })
    }
    if (!startDate) {
      return NextResponse.json({ error: 'Start date is required' }, { status: 400 })
    }
    if (!inputTopics || inputTopics.length === 0) {
      return NextResponse.json({ error: 'At least one topic is required' }, { status: 400 })
    }

    // Calculate total estimated hours from topics
    let totalEstimatedHours = 0
    inputTopics.forEach((topic: any) => {
      if (topic.subtopics && topic.subtopics.length > 0) {
        topic.subtopics.forEach((st: any) => {
          totalEstimatedHours += st.estimatedHours || 0
        })
      }
    })

    // Create plan and topics in transaction
    const result = await db.transaction(async (tx) => {
      // 1. Create plan
      const [newPlan] = await tx.insert(plans).values({
        userId,
        title: title.trim(),
        type: type || 'custom',
        startDate,
        endDate: endDate || null,
        dailyHours: dailyHours ? parseFloat(dailyHours) : null,
        totalEstimatedHours,
        color: color || '#7C3AED',
        isAiGenerated: isAiGenerated || false,
        status: 'active',
      }).returning()

      // 2. Prepare topics and subtopics for batch insert
      const topicsToInsert: any[] = []
      const subtopicsToInsert: any[] = []
      
      inputTopics.forEach((topic: any, topicIndex: number) => {
        const topicId = crypto.randomUUID()
        
        // Calculate topic hours from subtopics
        const topicHours = (topic.subtopics || []).reduce((sum: number, st: any) => sum + (st.estimatedHours || 0), 0)
        
        topicsToInsert.push({
          id: topicId,
          planId: newPlan.id,
          parentId: null,
          title: topic.title,
          estimatedHours: topicHours,
          priority: mapPriority(topic.priority),
          weightage: topic.weightage || null,
          scheduledDate: null,
          orderIndex: topicIndex,
          status: 'not_started',
          notes: null,
          isWeakArea: false,
        })

        // Add subtopics
        if (topic.subtopics && topic.subtopics.length > 0) {
          topic.subtopics.forEach((subtopic: any, stIndex: number) => {
            subtopicsToInsert.push({
              id: crypto.randomUUID(),
              planId: newPlan.id,
              parentId: topicId,
              title: subtopic.title,
              estimatedHours: subtopic.estimatedHours || 0,
              priority: mapPriority(subtopic.priority),
              weightage: null,
              scheduledDate: null,
              orderIndex: stIndex,
              status: 'not_started',
              notes: null,
              isWeakArea: false,
            })
          })
        }
      })

      // 3. Batch insert topics
      if (topicsToInsert.length > 0) {
        await tx.insert(topics).values(topicsToInsert)
      }

      // 4. Batch insert subtopics
      if (subtopicsToInsert.length > 0) {
        await tx.insert(topics).values(subtopicsToInsert)
      }

      return {
        plan: newPlan,
        topicsCount: topicsToInsert.length,
        subtopicsCount: subtopicsToInsert.length,
      }
    })

    return NextResponse.json({
      plan: result.plan,
      message: `Plan created with ${result.topicsCount} topics and ${result.subtopicsCount} subtopics`,
    }, { status: 201 })
  } catch (error) {
    console.error('Plans POST error:', error)
    return NextResponse.json({ error: 'Failed to create plan' }, { status: 500 })
  }
}

// Helper to map numeric priority to enum
function mapPriority(priority: number | string | undefined): 'highest' | 'high' | 'medium' | 'low' {
  if (typeof priority === 'string') {
    if (['highest', 'high', 'medium', 'low'].includes(priority)) {
      return priority as 'highest' | 'high' | 'medium' | 'low'
    }
  }
  if (typeof priority === 'number') {
    if (priority === 1) return 'highest'
    if (priority === 2) return 'high'
    if (priority === 3) return 'medium'
    if (priority === 4 || priority === 5) return 'low'
  }
  return 'medium'
}
