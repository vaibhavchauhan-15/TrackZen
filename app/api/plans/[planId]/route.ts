import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { plans, topics, dailyProgress, dailyStudyLogs, mockTests, revisionTracking, mistakeNotebook } from '@/lib/db/schema'
import { eq, and, sql, isNull, desc, gte } from 'drizzle-orm'

/**
 * OPTIMIZED Single Plan API
 * 
 * GET: Get plan with full topics tree and analytics
 * PATCH: Update plan status/details
 * DELETE: Delete plan (cascades to topics)
 * 
 * Performance optimizations:
 * 1. Parallel queries for analytics
 * 2. Efficient topic tree construction
 * 3. Selective data fetching
 * 4. Single transaction for updates
 */

export const dynamic = 'force-dynamic'

interface Params {
  params: Promise<{ planId: string }>
}

// GET /api/plans/[planId] - Get plan with topics and analytics
export async function GET(request: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { planId } = await params
    const userId = session.user.id
    const today = new Date()
    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(today.getDate() - 30)

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

    // Run all analytics queries in parallel
    const [
      allTopics,
      studyLogs,
      mockTestsData,
      revisionsData,
      mistakesData,
    ] = await Promise.all([
      // 1. Get all topics for this plan
      db.select({
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
      .orderBy(topics.orderIndex),

      // 2. Study logs for last 30 days
      db.select({
        date: dailyStudyLogs.date,
        plannedHours: dailyStudyLogs.plannedHours,
        actualHours: dailyStudyLogs.actualHours,
        topicsCompleted: dailyStudyLogs.topicsCompleted,
      })
      .from(dailyStudyLogs)
      .where(and(
        eq(dailyStudyLogs.planId, planId),
        eq(dailyStudyLogs.userId, userId),
        gte(dailyStudyLogs.date, thirtyDaysAgo.toISOString().split('T')[0])
      ))
      .orderBy(desc(dailyStudyLogs.date)),

      // 3. Mock tests data
      db.select({
        id: mockTests.id,
        testName: mockTests.testName,
        testDate: mockTests.testDate,
        status: mockTests.status,
        totalMarks: mockTests.totalMarks,
        scoredMarks: mockTests.scoredMarks,
        accuracy: mockTests.accuracy,
      })
      .from(mockTests)
      .where(and(
        eq(mockTests.planId, planId),
        eq(mockTests.userId, userId)
      ))
      .orderBy(desc(mockTests.testDate)),

      // 4. Revisions data - Need to join with topics to filter by planId
      db.select({
        id: revisionTracking.id,
        topicId: revisionTracking.topicId,
        stage: revisionTracking.stage,
        scheduledDate: revisionTracking.scheduledDate,
        completedDate: revisionTracking.completedDate,
      })
      .from(revisionTracking)
      .innerJoin(topics, eq(revisionTracking.topicId, topics.id))
      .where(and(
        eq(topics.planId, planId),
        eq(revisionTracking.userId, userId)
      )),

      // 5. Mistakes data
      db.select({
        id: mistakeNotebook.id,
        category: mistakeNotebook.category,
        isResolved: mistakeNotebook.isResolved,
      })
      .from(mistakeNotebook)
      .innerJoin(topics, eq(mistakeNotebook.topicId, topics.id))
      .where(and(
        eq(topics.planId, planId),
        eq(mistakeNotebook.userId, userId)
      )),
    ])

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
    
    // Calculate by priority
    const byPriority = {
      highest: { total: 0, completed: 0, percentage: '0%' },
      high: { total: 0, completed: 0, percentage: '0%' },
      medium: { total: 0, completed: 0, percentage: '0%' },
      low: { total: 0, completed: 0, percentage: '0%' },
    }
    
    subtopics.forEach(t => {
      const p = t.priority as keyof typeof byPriority
      if (byPriority[p]) {
        byPriority[p].total++
        if (t.status === 'completed') byPriority[p].completed++
      }
    })
    
    Object.keys(byPriority).forEach(key => {
      const p = byPriority[key as keyof typeof byPriority]
      p.percentage = p.total > 0 ? `${Math.round((p.completed / p.total) * 100)}%` : '0%'
    })

    // Calculate overdue topics
    const todayStr = today.toISOString().split('T')[0]
    const overdueTopics = subtopics.filter(t => 
      t.scheduledDate && 
      t.scheduledDate < todayStr && 
      t.status !== 'completed'
    ).length

    // Calculate daily target
    let dailyTarget: number | null = null
    if (planData.endDate && planData.dailyHours) {
      const remaining = subtopics.length - completedSubtopics.length
      const daysLeft = Math.max(1, Math.ceil((new Date(planData.endDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))
      dailyTarget = Math.ceil(remaining / daysLeft)
    }

    // Calculate study hours analytics
    const totalPlannedHours = studyLogs.reduce((sum, log) => sum + (log.plannedHours || 0), 0)
    const totalActualHours = studyLogs.reduce((sum, log) => sum + (log.actualHours || 0), 0)
    const avgDailyHours = studyLogs.length > 0 ? totalActualHours / studyLogs.length : 0
    const adherence = totalPlannedHours > 0 ? Math.round((totalActualHours / totalPlannedHours) * 100) : null

    // Mock test analytics
    const completedTests = mockTestsData.filter(t => t.status === 'completed')
    const scheduledTests = mockTestsData.filter(t => t.status === 'scheduled')
    const avgScore = completedTests.length > 0
      ? completedTests.reduce((sum, t) => sum + (t.accuracy || 0), 0) / completedTests.length
      : null

    // Revision analytics
    const pendingRevisions = revisionsData.filter(r => !r.completedDate)
    const overdueRevisions = pendingRevisions.filter(r => r.scheduledDate < todayStr).length

    // Mistakes analytics
    const unresolvedMistakes = mistakesData.filter(m => !m.isResolved)
    const mistakesByCategory: Record<string, number> = {}
    mistakesData.forEach(m => {
      const cat = m.category || 'Uncategorized'
      mistakesByCategory[cat] = (mistakesByCategory[cat] || 0) + 1
    })

    // Timeline analytics
    let daysAvailable: number | null = null
    let expectedProgress: number | null = null
    let isOnTrack: boolean | null = null
    
    if (planData.endDate) {
      const start = new Date(planData.startDate)
      const end = new Date(planData.endDate)
      daysAvailable = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      const daysPassed = Math.ceil((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      expectedProgress = daysAvailable > 0 ? Math.round((daysPassed / daysAvailable) * 100) : 0
      const actualProgress = subtopics.length > 0 ? (completedSubtopics.length / subtopics.length) * 100 : 0
      isOnTrack = actualProgress >= expectedProgress * 0.8 // Within 80% of expected
    }

    const daysPassed = Math.ceil((today.getTime() - new Date(planData.startDate).getTime()) / (1000 * 60 * 60 * 24))
    const progressPercentage = subtopics.length > 0 
      ? Math.round((completedSubtopics.length / subtopics.length) * 100) 
      : 0

    // Build response
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
      analytics: {
        timeline: {
          totalDaysAvailable: daysAvailable,
          daysPassed,
          bufferDays: daysAvailable ? Math.max(0, daysAvailable - daysPassed) : null,
          isOnTrack,
          progressPercentage,
          expectedProgress,
        },
        topics: {
          total: subtopics.length,
          completed: completedSubtopics.length,
          inProgress: inProgressSubtopics.length,
          remaining: subtopics.length - completedSubtopics.length,
          dailyTarget,
          byPriority,
          overdue: overdueTopics,
        },
        studyHours: {
          last30Days: {
            planned: Math.round(totalPlannedHours * 10) / 10,
            actual: Math.round(totalActualHours * 10) / 10,
            average: Math.round(avgDailyHours * 10) / 10,
            adherence,
          },
        },
        mockTests: {
          total: mockTestsData.length,
          completed: completedTests.length,
          averageScore: avgScore ? Math.round(avgScore * 10) / 10 : null,
          scheduled: scheduledTests.length,
        },
        revision: {
          total: revisionsData.length,
          pending: pendingRevisions.length,
          completed: revisionsData.length - pendingRevisions.length,
          overdueRevisions,
        },
        mistakes: {
          total: mistakesData.length,
          unresolved: unresolvedMistakes.length,
          byCategory: mistakesByCategory,
        },
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
