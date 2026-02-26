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
  mistakeNotebook
} from '@/lib/db/schema'
import { eq, and, gte, lte, sql, count, avg, sum } from 'drizzle-orm'
import { withAuth, ApiErrors, CacheHeaders } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  return withAuth(async (user) => {
    const searchParams = req.nextUrl.searchParams
    const planId = searchParams.get('planId')

    if (!planId) {
      return ApiErrors.badRequest('Plan ID is required')
    }

    // Get plan details
    const planResult = await db
      .select()
      .from(plans)
      .where(and(eq(plans.id, planId), eq(plans.userId, user.id)))
      .limit(1)

    if (planResult.length === 0) {
      return ApiErrors.notFound('Plan')
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

    // OPTIMIZATION: Use SQL aggregates instead of fetching all data
    // This is 10-100x faster for large datasets!
    const [
      topicStats,
      studyHoursStats,
      mockTestStats,
      revisionStats,
      mistakeStats
    ] = await Promise.all([
      // Get topic statistics with a single aggregate query
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

      // Get study hours with aggregates
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

      // Get mock test statistics
      db
        .select({
          total: count(),
          completed: sql<number>`COUNT(CASE WHEN ${mockTests.status} IN ('completed', 'analysed') THEN 1 END)`,
          scheduled: sql<number>`COUNT(CASE WHEN ${mockTests.status} = 'scheduled' THEN 1 END)`,
          avgAccuracy: avg(mockTests.accuracy)
        })
        .from(mockTests)
        .where(
          and(eq(mockTests.userId, user.id), eq(mockTests.planId, planId))
        ),

      // Get revision statistics
      db
        .select({
          total: count(),
          pending: sql<number>`COUNT(CASE WHEN ${revisionTracking.completedDate} IS NULL AND ${revisionTracking.scheduledDate} <= ${today.toISOString().split('T')[0]} THEN 1 END)`,
          completed: sql<number>`COUNT(CASE WHEN ${revisionTracking.completedDate} IS NOT NULL THEN 1 END)`
        })
        .from(revisionTracking)
        .where(eq(revisionTracking.userId, user.id)),

      // Get mistake statistics
      db
        .select({
          total: count(),
          unresolved: sql<number>`COUNT(CASE WHEN ${mistakeNotebook.isResolved} = false THEN 1 END)`,
          category: mistakeNotebook.category
        })
        .from(mistakeNotebook)
        .where(eq(mistakeNotebook.userId, user.id))
        .groupBy(mistakeNotebook.category),
    ])

    const tStats = topicStats[0] || { total: 0, completed: 0, inProgress: 0, highTotal: 0, highCompleted: 0, mediumTotal: 0, mediumCompleted: 0, lowTotal: 0, lowCompleted: 0, overdueTasks: 0 }
    const shStats = studyHoursStats[0] || { totalPlanned: 0, totalActual: 0, logCount: 0 }
    const mtStats = mockTestStats[0] || { total: 0, completed: 0, scheduled: 0, avgAccuracy: null }
    const rStats = revisionStats[0] || { total: 0, pending: 0, completed: 0 }

    // Build mistake category map
    const mistakesByCategory: Record<string, number> = {}
    let totalMistakes = 0
    let unresolvedMistakes = 0
    mistakeStats.forEach((stat: any) => {
      const cat = stat.category || 'Uncategorized'
      mistakesByCategory[cat] = Number(stat.total)
      totalMistakes += Number(stat.total)
      unresolvedMistakes += Number(stat.unresolved)
    })

    // Calculate derived metrics
    const totalTopics = Number(tStats.total)
    const completedTopics = Number(tStats.completed)
    const remainingTopics = totalTopics - completedTopics

    const dailyTarget = totalDaysAvailable && totalDaysAvailable > 0
      ? (remainingTopics / totalDaysAvailable).toFixed(2)
      : null

    const totalPlannedHours = Number(shStats.totalPlanned) || 0
    const totalActualHours = Number(shStats.totalActual) || 0
    const logCount = Number(shStats.logCount) || 0
    const averageDailyHours = logCount > 0 ? (totalActualHours / logCount).toFixed(2) : '0.00'
    const adherencePercentage = totalPlannedHours > 0 
      ? ((totalActualHours / totalPlannedHours) * 100).toFixed(1)
      : null

    const responseData = {
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
    }

    return NextResponse.json(responseData, { headers: CacheHeaders.medium })
  })
}
