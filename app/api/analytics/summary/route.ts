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
import { eq, and, gte, sql } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

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

    // Get global streak
    const globalStreakData = await db
      .select()
      .from(streaks)
      .where(and(eq(streaks.userId, userId), eq(streaks.type, 'global')))
      .limit(1)
    const streak = globalStreakData[0]?.currentStreak || 0

    // Get active plans
    const activePlans = await db
      .select()
      .from(plans)
      .where(and(eq(plans.userId, userId), eq(plans.status, 'active')))

    // Get plans with completion
    const plansWithCompletion = await Promise.all(
      activePlans.slice(0, 3).map(async (plan) => {
        const allTopics = await db.select().from(topics).where(eq(topics.planId, plan.id))
        const completedTopics = allTopics.filter((t) => t.status === 'completed')

        return {
          id: plan.id,
          title: plan.title,
          type: plan.type,
          completion: allTopics.length > 0 
            ? Math.round((completedTopics.length / allTopics.length) * 100) 
            : 0,
        }
      })
    )

    // Get today's tasks
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
      .limit(5)

    // Get weekly hours
    const weeklyProgressData = await db
      .select()
      .from(dailyProgress)
      .where(and(eq(dailyProgress.userId, userId), gte(dailyProgress.date, weekAgo)))

    const weeklyHours = weeklyProgressData.reduce(
      (sum, entry) => sum + (entry.hoursSpent || 0),
      0
    )

    // Get today's habits
    const todayHabits = await db
      .select()
      .from(habits)
      .where(and(eq(habits.userId, userId), eq(habits.isActive, true)))

    const todayLogs = await db
      .select()
      .from(habitLogs)
      .where(and(eq(habitLogs.userId, userId), eq(habitLogs.date, today)))

    const habitsCompleted = todayLogs.filter((log) => log.status === 'done').length

    // Get next exam days
    const upcomingPlans = await db
      .select()
      .from(plans)
      .where(
        and(
          eq(plans.userId, userId),
          eq(plans.status, 'active'),
          sql`${plans.endDate} IS NOT NULL`
        )
      )
      .orderBy(plans.endDate)
      .limit(1)

    let nextExamDays = null
    if (upcomingPlans.length > 0 && upcomingPlans[0].endDate) {
      const examDate = new Date(upcomingPlans[0].endDate)
      const todayDate = new Date()
      const diffTime = examDate.getTime() - todayDate.getTime()
      nextExamDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    }

    const todayHabitsWithCompletion = todayHabits.map((habit) => {
      const log = todayLogs.find((l) => l.habitId === habit.id)
      return {
        ...habit,
        completed: log?.status === 'done',
      }
    })

    return NextResponse.json({
      streak,
      todayTasks: todayTasks.map((t) => ({
        id: t.topics.id,
        title: t.topics.title,
        estimatedHours: t.topics.estimatedHours,
        priority: `P${t.topics.priority}`,
        completed: t.topics.status === 'completed',
      })),
      todayHabits: todayHabitsWithCompletion,
      activePlans: plansWithCompletion,
      weeklyHours: Math.round(weeklyHours * 10) / 10,
      habitsCompleted,
      nextExamDays,
    })
  } catch (error) {
    console.error('Error fetching analytics summary:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
