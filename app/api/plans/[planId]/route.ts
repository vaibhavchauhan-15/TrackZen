import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { plans, users, topics as topicsTable } from '@/lib/db/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { withAuth, ApiErrors, CacheHeaders } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: { planId: string } }
) {
  return withAuth(async (user) => {
    // Get plan
    const [plan] = await db
      .select()
      .from(plans)
      .where(and(eq(plans.id, params.planId), eq(plans.userId, user.id)))
      .limit(1)

    if (!plan) {
      return ApiErrors.notFound('Plan')
    }

    // Get ALL topics in one query (much faster than N+1)
    const allTopics = await db
      .select()
      .from(topicsTable)
      .where(eq(topicsTable.planId, params.planId))

    // Separate parent and child topics in memory (no extra DB queries)
    const parentTopics = allTopics.filter(t => !t.parentId)
    const subtopicsMap = new Map<string, typeof allTopics>()
    
    allTopics.forEach(topic => {
      if (topic.parentId) {
        if (!subtopicsMap.has(topic.parentId)) {
          subtopicsMap.set(topic.parentId, [])
        }
        subtopicsMap.get(topic.parentId)!.push(topic)
      }
    })

    // Build topics with subtopics structure
    const topicsWithSubtopics = parentTopics
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map(topic => ({
        ...topic,
        subtopics: (subtopicsMap.get(topic.id) || []).sort((a, b) => a.orderIndex - b.orderIndex),
      }))

    // Calculate statistics from already fetched data

    const completedTopics = allTopics.filter((t) => t.status === 'completed')
    const inProgressTopics = allTopics.filter((t) => t.status === 'in_progress')

    const responseData = {
      plan: {
        ...plan,
        topics: topicsWithSubtopics,
        totalTopics: allTopics.length,
        completedTopics: completedTopics.length,
        inProgressTopics: inProgressTopics.length,
      },
    }

    // Cache the response
    return NextResponse.json(responseData, { headers: CacheHeaders.short })
  })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { planId: string } }
) {
  return withAuth(async (user) => {
    const body = await req.json()
    const { status } = body

    // Update plan
    const [updatedPlan] = await db
      .update(plans)
      .set({ status })
      .where(and(eq(plans.id, params.planId), eq(plans.userId, user.id)))
      .returning()

    if (!updatedPlan) {
      return ApiErrors.notFound('Plan')
    }

    return NextResponse.json({ plan: updatedPlan })
  })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { planId: string } }
) {
  return withAuth(async (user) => {
    // Delete plan (cascade will handle topics)
    await db
      .delete(plans)
      .where(and(eq(plans.id, params.planId), eq(plans.userId, user.id)))

    return NextResponse.json({ success: true })
  })
}
