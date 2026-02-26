import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { 
  plans,
  topics, 
  dailyStudyLogs, 
  mockTests, 
  revisionTracking,
  mistakeNotebook
} from '@/lib/db/schema'
import { eq, and, gte, lte, sql, count, avg, sum } from 'drizzle-orm'
import { withAuth, CacheHeaders } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

/**
 * Unified Analytics API - Fetches ALL analytics data in ONE request
 * 
 * OPTIMIZATION: Instead of 4 separate API calls per tab, this returns
 * everything at once. Frontend caches it and passes slices to each tab.
 * 
 * OLD FLOW (4+ API calls):
 * - Tab 1 mount → /api/analytics/study-tracker
 * - Tab 2 mount → /api/mistakes  
 * - Tab 3 mount → /api/mock-tests
 * - Tab 4 mount → /api/revisions
 * 
 * NEW FLOW (1 API call):
 * - Parent page → /api/analytics/all
 * - Tabs receive data as props (instant, no loading)
 */
export async function GET(req: NextRequest) {
  return withAuth(async (user) => {
    const searchParams = req.nextUrl.searchParams
    const planId = searchParams.get('planId')

    if (!planId) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 })
    }

    // Verify plan exists and belongs to user
    const planResult = await db
      .select()
      .from(plans)
      .where(and(eq(plans.id, planId), eq(plans.userId, user.id)))
      .limit(1)

    if (planResult.length === 0) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }
    const plan = planResult[0]

    const today = new Date()
    const startDate = new Date(plan.startDate)
    const endDate = plan.endDate ? new Date(plan.endDate) : null
    
    const totalDaysAvailable = endDate 
      ? Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      : null
    
    const daysPassed = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

    // OPTIMIZATION: Fetch ALL analytics data in parallel (Promise.all)
    const [
      topicStats,
      studyHoursStats,
      mockTestStats,
      mockTestsData,
      revisionStats,
      revisionsData,
      mistakeStats,
      mistakesData
    ] = await Promise.all([
      // 1. Topic statistics
      db
        .select({
          total: count(),
          completed: sql<number>`COUNT(CASE WHEN ${topics.status} = 'completed' THEN 1 END)`,
          inProgress: sql<number>`COUNT(CASE WHEN ${topics.status} = 'in_progress' THEN 1 END)`,
          highTotal: sql<number>`COUNT(CASE WHEN ${topics.priority} = 'high' OR ${topics.priority} = 'highest' THEN 1 END)`,
          highCompleted: sql<number>`COUNT(CASE WHEN (${topics.priority} = 'high' OR ${topics.priority} = 'highest') AND ${topics.status} = 'completed' THEN 1 END)`,
          mediumTotal: sql<number>`COUNT(CASE WHEN ${topics.priority} = 'medium' THEN 1 END)`,
          mediumCompleted: sql<number>`COUNT(CASE WHEN ${topics.priority} = 'medium' AND ${topics.status} = 'completed' THEN 1 END)`,
          lowTotal: sql<number>`COUNT(CASE WHEN ${topics.priority} = 'low' THEN 1 END)`,
          lowCompleted: sql<number>`COUNT(CASE WHEN ${topics.priority} = 'low' AND ${topics.status} = 'completed' THEN 1 END)`,
          overdueTasks: sql<number>`COUNT(CASE WHEN ${topics.status} != 'completed' AND ${topics.scheduledDate} IS NOT NULL AND ${topics.scheduledDate} < ${today.toISOString().split('T')[0]} THEN 1 END)`
        })
        .from(topics)
        .where(eq(topics.planId, planId)),

      // 2. Study hours
      db
        .select({
          totalPlanned: sum(dailyStudyLogs.plannedHours),
          totalActual: sum(dailyStudyLogs.actualHours),
          logCount: count(),
        })
        .from(dailyStudyLogs)
        .where(
          and(
            eq(dailyStudyLogs.userId, user.id),
            eq(dailyStudyLogs.planId, planId),
            gte(dailyStudyLogs.date, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
          )
        ),

      // 3. Mock test statistics
      db
        .select({
          total: count(),
          completed: sql<number>`COUNT(CASE WHEN ${mockTests.status} IN ('completed', 'analysed') THEN 1 END)`,
          scheduled: sql<number>`COUNT(CASE WHEN ${mockTests.status} = 'scheduled' THEN 1 END)`,
          avgAccuracy: avg(mockTests.accuracy)
        })
        .from(mockTests)
        .where(and(eq(mockTests.userId, user.id), eq(mockTests.planId, planId))),

      // 4. Mock tests data (for tab)
      db
        .select()
        .from(mockTests)
        .where(and(eq(mockTests.userId, user.id), eq(mockTests.planId, planId)))
        .orderBy(mockTests.testDate),

      // 5. Revision statistics
      db
        .select({
          total: count(),
          pending: sql<number>`COUNT(CASE WHEN ${revisionTracking.completedDate} IS NULL AND ${revisionTracking.scheduledDate} <= ${today.toISOString().split('T')[0]} THEN 1 END)`,
          completed: sql<number>`COUNT(CASE WHEN ${revisionTracking.completedDate} IS NOT NULL THEN 1 END)`
        })
        .from(revisionTracking)
        .where(eq(revisionTracking.userId, user.id)),

      // 6. Revisions data (for tab)
      db
        .select({
          revision: revisionTracking,
          topic: topics
        })
        .from(revisionTracking)
        .leftJoin(topics, eq(revisionTracking.topicId, topics.id))
        .where(eq(revisionTracking.userId, user.id))
        .orderBy(revisionTracking.scheduledDate),

      // 7. Mistake statistics
      db
        .select({
          total: count(),
          unresolved: sql<number>`COUNT(CASE WHEN ${mistakeNotebook.isResolved} = false THEN 1 END)`,
          category: mistakeNotebook.category
        })
        .from(mistakeNotebook)
        .where(eq(mistakeNotebook.userId, user.id))
        .groupBy(mistakeNotebook.category),

      // 8. Mistakes data (for tab)
      db
        .select()
        .from(mistakeNotebook)
        .where(eq(mistakeNotebook.userId, user.id))
        .orderBy(mistakeNotebook.createdAt),
    ])

    // Process topic stats
    const tStats = topicStats[0] || { 
      total: 0, completed: 0, inProgress: 0, 
      highTotal: 0, highCompleted: 0, 
      mediumTotal: 0, mediumCompleted: 0, 
      lowTotal: 0, lowCompleted: 0, 
      overdueTasks: 0 
    }

    const totalTopics = Number(tStats.total)
    const completedTopics = Number(tStats.completed)
    const remainingTopics = totalTopics - completedTopics

    const dailyTarget = totalDaysAvailable && totalDaysAvailable > 0
      ? (remainingTopics / totalDaysAvailable).toFixed(2)
      : null

    // Process study hours
    const shStats = studyHoursStats[0] || { totalPlanned: 0, totalActual: 0, logCount: 0 }
    const totalPlannedHours = Number(shStats.totalPlanned) || 0
    const totalActualHours = Number(shStats.totalActual) || 0
    const logCount = Number(shStats.logCount) || 0
    const averageDailyHours = logCount > 0 ? (totalActualHours / logCount).toFixed(2) : '0.00'
    const adherencePercentage = totalPlannedHours > 0 
      ? ((totalActualHours / totalPlannedHours) * 100).toFixed(1)
      : null

    // Process mock tests
    const mtStats = mockTestStats[0] || { total: 0, completed: 0, scheduled: 0, avgAccuracy: null }

    // Process revisions
    const rStats = revisionStats[0] || { total: 0, pending: 0, completed: 0 }

    // Process mistakes
    const mistakesByCategory: Record<string, number> = {}
    let totalMistakes = 0
    let unresolvedMistakes = 0
    mistakeStats.forEach((stat: any) => {
      const cat = stat.category || 'Uncategorized'
      mistakesByCategory[cat] = Number(stat.total)
      totalMistakes += Number(stat.total)
      unresolvedMistakes += Number(stat.unresolved)
    })

    // Build comprehensive response
    const responseData = {
      // Study Tracker Tab Data
      studyTracker: {
        topics: {
          total: totalTopics,
          completed: completedTopics,
          inProgress: Number(tStats.inProgress),
          remaining: remainingTopics,
          dailyTarget: dailyTarget ? parseFloat(dailyTarget) : null,
          byPriority: {
            high: {
              total: Number(tStats.highTotal),
              completed: Number(tStats.highCompleted),
              percentage: Number(tStats.highTotal) > 0 
                ? ((Number(tStats.highCompleted) / Number(tStats.highTotal)) * 100).toFixed(1)
                : 0,
            },
            medium: {
              total: Number(tStats.mediumTotal),
              completed: Number(tStats.mediumCompleted),
              percentage: Number(tStats.mediumTotal) > 0
                ? ((Number(tStats.mediumCompleted) / Number(tStats.mediumTotal)) * 100).toFixed(1)
                : 0,
            },
            low: {
              total: Number(tStats.lowTotal),
              completed: Number(tStats.lowCompleted),
              percentage: Number(tStats.lowTotal) > 0
                ? ((Number(tStats.lowCompleted) / Number(tStats.lowTotal)) * 100).toFixed(1)
                : 0,
            },
          },
          overdue: Number(tStats.overdueTasks),
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
          total: Number(mtStats.total),
          completed: Number(mtStats.completed),
          averageScore: mtStats.avgAccuracy ? parseFloat(Number(mtStats.avgAccuracy).toFixed(1)) : null,
          scheduled: Number(mtStats.scheduled),
        },
        revision: {
          total: Number(rStats.total),
          pending: Number(rStats.pending),
          completed: Number(rStats.completed),
          overdueRevisions: Number(rStats.pending),
        },
        mistakes: {
          total: totalMistakes,
          unresolved: unresolvedMistakes,
          byCategory: mistakesByCategory,
        },
      },

      // Mock Tests Tab Data
      mockTests: mockTestsData,

      // Revisions Tab Data
      revisions: revisionsData,

      // Mistakes Tab Data
      mistakes: mistakesData,

      // Metadata
      plan: {
        id: plan.id,
        title: plan.title,
        startDate: plan.startDate,
        endDate: plan.endDate,
        totalDaysAvailable,
        daysPassed,
      },
    }

    return NextResponse.json(responseData, { headers: CacheHeaders.medium })
  })
}
