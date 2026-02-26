import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  plans,
  topics as topicsTable,
  dailyStudyLogs,
  mockTests,
  revisionTracking,
  mistakeNotebook,
} from '@/lib/db/schema'
import { eq, and, gte, sql, count, avg, sum } from 'drizzle-orm'
import { withAuth, CacheHeaders } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

/**
 * Unified Planner Page API - Fetches plan + analytics in ONE request
 * 
 * OPTIMIZATION: Instead of 2 separate API calls:
 * - /api/plans/[planId] (gets plan with topics)
 * - /api/analytics/study-tracker?planId=[planId] (gets analytics)
 * 
 * This returns everything needed for the planner detail page in 1 call.
 * Reduces initial page load from 2 API calls to 1.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { planId: string } }
) {
  return withAuth(async (user) => {
    const planId = params.planId

    // Get plan
    const [plan] = await db
      .select()
      .from(plans)
      .where(and(eq(plans.id, planId), eq(plans.userId, user.id)))
      .limit(1)

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    const today = new Date()
    const startDate = new Date(plan.startDate)
    const endDate = plan.endDate ? new Date(plan.endDate) : null

    const totalDaysAvailable = endDate
      ? Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      : null

    const daysPassed = Math.ceil(
      (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    // OPTIMIZATION: Fetch ALL data in parallel (Promise.all)
    const [allTopics, topicStats, studyHoursStats, mockTestStats, revisionStats, mistakeStats] =
      await Promise.all([
        // 1. Get all topics with hierarchy
        db.select().from(topicsTable).where(eq(topicsTable.planId, planId)),

        // 2. Topic statistics
        db
          .select({
            total: count(),
            completed: sql<number>`COUNT(CASE WHEN ${topicsTable.status} = 'completed' THEN 1 END)`,
            inProgress: sql<number>`COUNT(CASE WHEN ${topicsTable.status} = 'in_progress' THEN 1 END)`,
            highTotal: sql<number>`COUNT(CASE WHEN ${topicsTable.priority} = 'high' OR ${topicsTable.priority} = 'highest' THEN 1 END)`,
            highCompleted: sql<number>`COUNT(CASE WHEN (${topicsTable.priority} = 'high' OR ${topicsTable.priority} = 'highest') AND ${topicsTable.status} = 'completed' THEN 1 END)`,
            mediumTotal: sql<number>`COUNT(CASE WHEN ${topicsTable.priority} = 'medium' THEN 1 END)`,
            mediumCompleted: sql<number>`COUNT(CASE WHEN ${topicsTable.priority} = 'medium' AND ${topicsTable.status} = 'completed' THEN 1 END)`,
            lowTotal: sql<number>`COUNT(CASE WHEN ${topicsTable.priority} = 'low' THEN 1 END)`,
            lowCompleted: sql<number>`COUNT(CASE WHEN ${topicsTable.priority} = 'low' AND ${topicsTable.status} = 'completed' THEN 1 END)`,
            overdueTasks: sql<number>`COUNT(CASE WHEN ${topicsTable.status} != 'completed' AND ${topicsTable.scheduledDate} IS NOT NULL AND ${topicsTable.scheduledDate} < ${today.toISOString().split('T')[0]} THEN 1 END)`
          })
          .from(topicsTable)
          .where(eq(topicsTable.planId, planId)),

        // 3. Study hours
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
              gte(
                dailyStudyLogs.date,
                new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
              )
            )
          ),

        // 4. Mock test statistics
        db
          .select({
            total: count(),
            completed: sql<number>`COUNT(CASE WHEN ${mockTests.status} IN ('completed', 'analysed') THEN 1 END)`,
            scheduled: sql<number>`COUNT(CASE WHEN ${mockTests.status} = 'scheduled' THEN 1 END)`,
            avgAccuracy: avg(mockTests.accuracy)
          })
          .from(mockTests)
          .where(and(eq(mockTests.userId, user.id), eq(mockTests.planId, planId))),

        // 5. Revision statistics
        db
          .select({
            total: count(),
            pending: sql<number>`COUNT(CASE WHEN ${revisionTracking.completedDate} IS NULL AND ${revisionTracking.scheduledDate} <= ${today.toISOString().split('T')[0]} THEN 1 END)`,
            completed: sql<number>`COUNT(CASE WHEN ${revisionTracking.completedDate} IS NOT NULL THEN 1 END)`
          })
          .from(revisionTracking)
          .where(eq(revisionTracking.userId, user.id)),

        // 6. Mistake statistics
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

    // Build topic hierarchy in memory (fast!)
    const parentTopics = allTopics.filter((t) => !t.parentId)
    const subtopicsMap = new Map<string, typeof allTopics>()

    allTopics.forEach((topic) => {
      if (topic.parentId) {
        if (!subtopicsMap.has(topic.parentId)) {
          subtopicsMap.set(topic.parentId, [])
        }
        subtopicsMap.get(topic.parentId)!.push(topic)
      }
    })

    const topicsWithSubtopics = parentTopics
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((topic) => ({
        ...topic,
        subtopics: (subtopicsMap.get(topic.id) || []).sort((a, b) => a.orderIndex - b.orderIndex),
      }))

    // Calculate statistics
    const tStats = topicStats[0] || {
      total: 0,
      completed: 0,
      inProgress: 0,
      highTotal: 0,
      highCompleted: 0,
      mediumTotal: 0,
      mediumCompleted: 0,
      lowTotal: 0,
      lowCompleted: 0,
      overdueTasks: 0,
    }

    const totalTopics = Number(tStats.total)
    const completedTopics = Number(tStats.completed)
    const remainingTopics = totalTopics - completedTopics

    const dailyTarget =
      totalDaysAvailable && totalDaysAvailable > 0
        ? (remainingTopics / totalDaysAvailable).toFixed(2)
        : null

    const progressPercentage =
      totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0

    const expectedProgress =
      totalDaysAvailable && plan.endDate
        ? ((daysPassed / (daysPassed + totalDaysAvailable)) * 100).toFixed(1)
        : null

    const bufferDays =
      totalDaysAvailable && dailyTarget
        ? Math.floor(totalDaysAvailable - remainingTopics / parseFloat(dailyTarget))
        : null

    const isOnTrack =
      expectedProgress !== null ? progressPercentage >= parseFloat(expectedProgress) : null

    // Process study hours
    const shStats = studyHoursStats[0] || { totalPlanned: 0, totalActual: 0, logCount: 0 }
    const totalPlannedHours = Number(shStats.totalPlanned) || 0
    const totalActualHours = Number(shStats.totalActual) || 0
    const logCount = Number(shStats.logCount) || 0
    const averageDailyHours = logCount > 0 ? (totalActualHours / logCount).toFixed(2) : '0.00'
    const adherencePercentage =
      totalPlannedHours > 0
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
      // Plan data with topics
      plan: {
        ...plan,
        topics: topicsWithSubtopics,
        totalTopics,
        completedTopics,
        inProgressTopics: Number(tStats.inProgress),
      },

      // Analytics data
      analytics: {
        timeline: {
          totalDaysAvailable,
          daysPassed,
          bufferDays,
          isOnTrack,
          progressPercentage,
          expectedProgress: expectedProgress ? parseFloat(expectedProgress) : null,
        },
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
              percentage:
                Number(tStats.highTotal) > 0
                  ? ((Number(tStats.highCompleted) / Number(tStats.highTotal)) * 100).toFixed(1)
                  : '0',
            },
            medium: {
              total: Number(tStats.mediumTotal),
              completed: Number(tStats.mediumCompleted),
              percentage:
                Number(tStats.mediumTotal) > 0
                  ? ((Number(tStats.mediumCompleted) / Number(tStats.mediumTotal)) * 100).toFixed(
                      1
                    )
                  : '0',
            },
            low: {
              total: Number(tStats.lowTotal),
              completed: Number(tStats.lowCompleted),
              percentage:
                Number(tStats.lowTotal) > 0
                  ? ((Number(tStats.lowCompleted) / Number(tStats.lowTotal)) * 100).toFixed(1)
                  : '0',
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
          averageScore: mtStats.avgAccuracy
            ? parseFloat(Number(mtStats.avgAccuracy).toFixed(1))
            : null,
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
    }

    return NextResponse.json(responseData, { headers: CacheHeaders.short })
  })
}
