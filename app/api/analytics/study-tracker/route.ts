import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { 
  users, 
  plans, 
  topics, 
  dailyStudyLogs, 
  mockTests, 
  revisionTracking,
  mistakeNotebook,
  weeklyReviews 
} from '@/lib/db/schema'
import { eq, and, gte, lte, sql, count, avg, sum } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userResult = await db.select().from(users).where(eq(users.email, session.user.email)).limit(1)
    if (userResult.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    const user = userResult[0]

    const searchParams = req.nextUrl.searchParams
    const planId = searchParams.get('planId')

    if (!planId) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 })
    }

    // Get plan details
    const planResult = await db
      .select()
      .from(plans)
      .where(and(eq(plans.id, planId), eq(plans.userId, user.id)))
      .limit(1)

    if (planResult.length === 0) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }
    const plan = planResult[0]

    // Calculate timeline metrics
    const today = new Date()
    const startDate = new Date(plan.startDate)
    const endDate = plan.endDate ? new Date(plan.endDate) : null
    
    const totalDaysAvailable = endDate 
      ? Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      : null
    
    const daysPassed = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

    // Get all topics with priority breakdown
    const allTopics = await db
      .select()
      .from(topics)
      .where(eq(topics.planId, planId))

    const totalTopics = allTopics.length
    const completedTopics = allTopics.filter(t => t.status === 'completed').length
    const inProgressTopics = allTopics.filter(t => t.status === 'in_progress').length

    // Priority breakdown
    const highPriorityTopics = allTopics.filter(t => t.priority === 'high')
    const mediumPriorityTopics = allTopics.filter(t => t.priority === 'medium')
    const lowPriorityTopics = allTopics.filter(t => t.priority === 'low')

    const highPriorityCompleted = highPriorityTopics.filter(t => t.status === 'completed').length
    const mediumPriorityCompleted = mediumPriorityTopics.filter(t => t.status === 'completed').length
    const lowPriorityCompleted = lowPriorityTopics.filter(t => t.status === 'completed').length

    // Calculate daily target
    const remainingTopics = totalTopics - completedTopics
    const dailyTarget = totalDaysAvailable && totalDaysAvailable > 0
      ? (remainingTopics / totalDaysAvailable).toFixed(2)
      : null

    // Get study logs for the last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentLogs = await db
      .select()
      .from(dailyStudyLogs)
      .where(
        and(
          eq(dailyStudyLogs.userId, user.id),
          eq(dailyStudyLogs.planId, planId),
          gte(dailyStudyLogs.date, thirtyDaysAgo.toISOString().split('T')[0])
        )
      )

    const totalPlannedHours = recentLogs.reduce((sum, log) => sum + (log.plannedHours || 0), 0)
    const totalActualHours = recentLogs.reduce((sum, log) => sum + (log.actualHours || 0), 0)
    const averageDailyHours = recentLogs.length > 0 ? (totalActualHours / recentLogs.length).toFixed(2) : 0

    // Calculate adherence percentage
    const adherencePercentage = totalPlannedHours > 0
      ? ((totalActualHours / totalPlannedHours) * 100).toFixed(1)
      : null

    // Get mock test statistics
    const allMockTests = await db
      .select()
      .from(mockTests)
      .where(
        and(
          eq(mockTests.userId, user.id),
          eq(mockTests.planId, planId)
        )
      )

    const completedMocks = allMockTests.filter(m => m.status === 'completed' || m.status === 'analysed')
    const averageMockScore = completedMocks.length > 0
      ? (completedMocks.reduce((sum, m) => sum + (m.accuracy || 0), 0) / completedMocks.length).toFixed(1)
      : null

    // Get revision statistics
    const allRevisions = await db
      .select()
      .from(revisionTracking)
      .where(eq(revisionTracking.userId, user.id))

    const pendingRevisions = allRevisions.filter(r => !r.completedDate && new Date(r.scheduledDate) <= today)
    const completedRevisions = allRevisions.filter(r => r.completedDate)

    // Get mistake statistics
    const allMistakes = await db
      .select()
      .from(mistakeNotebook)
      .where(eq(mistakeNotebook.userId, user.id))

    const unresolvedMistakes = allMistakes.filter(m => !m.isResolved).length
    const mistakesByCategory = allMistakes.reduce((acc, m) => {
      const cat = m.category || 'Uncategorized'
      acc[cat] = (acc[cat] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Calculate progress percentage
    const progressPercentage = totalTopics > 0
      ? parseFloat(((completedTopics / totalTopics) * 100).toFixed(1))
      : 0

    // Calculate if on track (based on timeline)
    const expectedProgress = daysPassed > 0 && endDate
      ? (daysPassed / Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))) * 100
      : null

    const isOnTrack = expectedProgress !== null
      ? progressPercentage >= expectedProgress
      : null

    // Get latest weekly review
    const latestReview = await db
      .select()
      .from(weeklyReviews)
      .where(
        and(
          eq(weeklyReviews.userId, user.id),
          eq(weeklyReviews.planId, planId)
        )
      )
      .orderBy(sql`${weeklyReviews.weekStartDate} DESC`)
      .limit(1)

    // Calculate buffer days
    const bufferDays = totalDaysAvailable && totalDaysAvailable > 0
      ? Math.floor(totalDaysAvailable * 0.1) // 10% buffer
      : null

    // Backlog calculation (topics overdue)
    const overdueTasks = allTopics.filter(t => {
      if (t.status === 'completed') return false
      if (!t.scheduledDate) return false
      return new Date(t.scheduledDate) < today
    }).length

    return NextResponse.json({
      timeline: {
        totalDaysAvailable,
        daysPassed,
        bufferDays,
        isOnTrack,
        progressPercentage,
        expectedProgress,
      },
      topics: {
        total: totalTopics,
        completed: completedTopics,
        inProgress: inProgressTopics,
        remaining: remainingTopics,
        dailyTarget: dailyTarget ? parseFloat(dailyTarget) : null,
        byPriority: {
          high: {
            total: highPriorityTopics.length,
            completed: highPriorityCompleted,
            percentage: highPriorityTopics.length > 0 
              ? ((highPriorityCompleted / highPriorityTopics.length) * 100).toFixed(1)
              : 0,
          },
          medium: {
            total: mediumPriorityTopics.length,
            completed: mediumPriorityCompleted,
            percentage: mediumPriorityTopics.length > 0
              ? ((mediumPriorityCompleted / mediumPriorityTopics.length) * 100).toFixed(1)
              : 0,
          },
          low: {
            total: lowPriorityTopics.length,
            completed: lowPriorityCompleted,
            percentage: lowPriorityTopics.length > 0
              ? ((lowPriorityCompleted / lowPriorityTopics.length) * 100).toFixed(1)
              : 0,
          },
        },
        overdue: overdueTasks,
      },
      studyHours: {
        last30Days: {
          planned: totalPlannedHours,
          actual: totalActualHours,
          average: parseFloat(averageDailyHours as string),
          adherence: adherencePercentage ? parseFloat(adherencePercentage) : null,
        },
      },
      mockTests: {
        total: allMockTests.length,
        completed: completedMocks.length,
        averageScore: averageMockScore ? parseFloat(averageMockScore) : null,
        scheduled: allMockTests.filter(m => m.status === 'scheduled').length,
      },
      revision: {
        total: allRevisions.length,
        pending: pendingRevisions.length,
        completed: completedRevisions.length,
        overdueRevisions: pendingRevisions.length,
      },
      mistakes: {
        total: allMistakes.length,
        unresolved: unresolvedMistakes,
        byCategory: mistakesByCategory,
      },
      latestWeeklyReview: latestReview[0] || null,
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
