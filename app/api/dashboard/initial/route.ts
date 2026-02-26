import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import {
  users,
  plans,
  topics,
  dailyProgress,
  habits,
  habitLogs,
  streaks,
} from '@/lib/db/schema'
import { eq, and, gte } from 'drizzle-orm'
import { calculateGlobalStreak } from '@/lib/streak'

export const dynamic = 'force-dynamic'

// Unified endpoint to fetch all initial data in one call
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db.select().from(users).where(eq(users.email, session.user.email)).limit(1)
    if (!user.length) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userId = user[0].id
    const today = new Date().toISOString().split('T')[0]
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    // Fetch all data in parallel for maximum performance
    const [
      globalStreak,
      userPlans,
      todayHabits,
      todayLogs,
      weeklyProgressData,
    ] = await Promise.all([
      calculateGlobalStreak(userId),
      
      // Get all plans with topic counts
      db.select().from(plans).where(eq(plans.userId, userId)).orderBy(plans.createdAt),
      
      // Get active habits
      db.select().from(habits).where(and(eq(habits.userId, userId), eq(habits.isActive, true))),
      
      // Get today's habit logs
      db.select().from(habitLogs).where(and(eq(habitLogs.userId, userId), eq(habitLogs.date, today))),
      
      // Get weekly progress
      db.select().from(dailyProgress).where(and(eq(dailyProgress.userId, userId), gte(dailyProgress.date, weekAgo))),
    ])

    // Process plans with topic counts (parallel)
    const plansWithCounts = await Promise.all(
      userPlans.map(async (plan) => {
        const allTopics = await db.select().from(topics).where(eq(topics.planId, plan.id))
        const completedTopics = allTopics.filter((t) => t.status === 'completed')

        return {
          ...plan,
          totalTopics: allTopics.length,
          completedTopics: completedTopics.length,
        }
      })
    )

    // Get today's scheduled topics for all active plans
    const todayTasks = await db
      .select()
      .from(topics)
      .innerJoin(plans, eq(topics.planId, plans.id))
      .where(
        and(
          eq(plans.userId, userId),
          eq(plans.status, 'active'),
          eq(topics.scheduledDate, today)
        )
      )

    // Process habit logs
    const todayLogsMap: Record<string, any> = {}
    todayLogs.forEach((log) => {
      todayLogsMap[log.habitId] = log
    })

    // Calculate weekly hours
    const weeklyHours = weeklyProgressData.reduce(
      (sum, entry) => sum + (entry.hoursSpent || 0),
      0
    )

    // Calculate habit completion
    const habitsCompleted = Object.values(todayLogsMap).filter(
      (log) => log.status === 'done'
    ).length

    // Find next exam date
    const activePlansWithEndDates = plansWithCounts.filter(
      (p) => p.status === 'active' && p.endDate
    )
    const nextExamDays =
      activePlansWithEndDates.length > 0
        ? Math.min(
            ...activePlansWithEndDates.map((p) => {
              const endDate = new Date(p.endDate!)
              const now = new Date()
              return Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
            })
          )
        : null

    // Build response data
    const responseData = {
      // User info
      user: {
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
      },
      
      // Streak data
      streak: globalStreak,
      
      // Plans data
      plans: plansWithCounts,
      activePlans: plansWithCounts.filter((p) => p.status === 'active').slice(0, 3),
      
      // Habits data
      habits: todayHabits,
      todayLogs: todayLogsMap,
      habitsCompleted,
      
      // Dashboard summary
      summary: {
        streak: globalStreak,
        todayTasks: todayTasks.map((t) => t.topics),
        todayHabits,
        activePlans: plansWithCounts.filter((p) => p.status === 'active').slice(0, 3).map((p) => ({
          id: p.id,
          title: p.title,
          type: p.type,
          completion: p.totalTopics > 0 ? Math.round((p.completedTopics / p.totalTopics) * 100) : 0,
        })),
        weeklyHours: Math.round(weeklyHours * 10) / 10,
        habitsCompleted,
        nextExamDays,
      },
    }

    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 'private, max-age=30, stale-while-revalidate=60',
      },
    })
  } catch (error) {
    console.error('Error fetching initial dashboard data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
