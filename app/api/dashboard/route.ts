import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { plans, topics, habits, habitLogs, streaks, dailyProgress } from '@/lib/db/schema'
import { eq, and, sql, gte, lte, desc, ne } from 'drizzle-orm'

/**
 * OPTIMIZED Dashboard Summary API — Read-Only Overview
 *
 * Returns minimal summary payload for the read-only dashboard.
 * Uses parallel queries, SQL aggregates, and strict LIMIT on every query.
 *
 * Response shape:
 * {
 *   streak:          { current, longest, lastActiveDate }
 *   analytics:       { weeklyStudyHours, habitsCompletedToday, remainingExamDays }
 *   plannerOverview: { todaysTopics[], recentPlans[] }
 *   habitOverview:   { todaysHabits[], recentHabits[] }
 * }
 */

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Helper to build response with no-store cache control
const jsonResponse = (data: any, status = 200) =>
  NextResponse.json(data, {
    status,
    headers: {
      // Prevent CDN caching; allow browser to revalidate with stale-while-revalidate
      'Cache-Control': 'no-store, must-revalidate',
    },
  })

// Alias for parent topic in self-join
const parentTopics = topics

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const now = new Date()
    const today = now.toISOString().split('T')[0]

    // Week start (Monday)
    const dayOfWeek = now.getDay()
    const monday = new Date(now)
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
    const weekStart = monday.toISOString().split('T')[0]

    // ── All queries in parallel ──────────────────────────────────────────────
    const [
      streakRow,
      weeklyHoursRow,
      habitsCompletedRow,
      nearestExamRow,
      todaysTopicsRaw,
      recentPlansRaw,
      todaysHabitsRaw,
      recentHabitsRaw,
    ] = await Promise.all([

      // 1. Global streak
      db
        .select({
          current: streaks.currentStreak,
          longest: streaks.longestStreak,
          lastActiveDate: streaks.lastActiveDate,
        })
        .from(streaks)
        .where(and(eq(streaks.userId, userId), sql`${streaks.type} = 'global'`))
        .limit(1),

      // 2. Weekly study hours (aggregate only)
      db
        .select({
          total: sql<number>`COALESCE(SUM(${dailyProgress.hoursSpent}), 0)`.as('total'),
        })
        .from(dailyProgress)
        .where(
          and(
            eq(dailyProgress.userId, userId),
            gte(dailyProgress.date, weekStart),
            lte(dailyProgress.date, today),
          ),
        ),

      // 3. Habits completed today (COUNT only)
      db
        .select({
          count: sql<number>`COUNT(*)`.as('count'),
        })
        .from(habitLogs)
        .where(
          and(
            eq(habitLogs.userId, userId),
            eq(habitLogs.date, today),
            sql`${habitLogs.status} = 'done'`,
          ),
        ),

      // 4. Nearest active exam plan (for remaining days)
      db
        .select({ endDate: plans.endDate })
        .from(plans)
        .where(
          and(
            eq(plans.userId, userId),
            sql`${plans.status} = 'active'`,
            sql`${plans.type} = 'exam'`,
            sql`${plans.endDate} IS NOT NULL`,
            gte(plans.endDate!, today),
          ),
        )
        .orderBy(plans.endDate!)
        .limit(1),

      // 5. Today's scheduled topics (not completed) — LIMIT 5
      db
        .select({
          id: topics.id,
          title: topics.title,
          estimatedHours: topics.estimatedHours,
          priority: topics.priority,
          planId: topics.planId,
          planTitle: plans.title,
          parentTitle: sql<string | null>`pt.title`.as('parentTitle'),
        })
        .from(topics)
        .innerJoin(plans, eq(topics.planId, plans.id))
        .leftJoin(
          sql`${parentTopics} pt`,
          sql`${topics.parentId} = pt.id`,
        )
        .where(
          and(
            eq(plans.userId, userId),
            eq(topics.scheduledDate, today),
            ne(topics.status, 'completed'),
          ),
        )
        .orderBy(topics.priority, topics.estimatedHours)
        .limit(5),

      // 6. Recent plans — LIMIT 2, with completion %
      db
        .select({
          id: plans.id,
          title: plans.title,
          status: plans.status,
          endDate: plans.endDate,
          color: plans.color,
          total: sql<number>`COUNT(sub.id)`.as('total'),
          completed: sql<number>`SUM(CASE WHEN sub.status = 'completed' THEN 1 ELSE 0 END)`.as('completed'),
        })
        .from(plans)
        .leftJoin(
          sql`${topics} sub`,
          sql`sub.plan_id = ${plans.id} AND sub.parent_id IS NOT NULL`,
        )
        .where(eq(plans.userId, userId))
        .groupBy(plans.id, plans.title, plans.status, plans.endDate, plans.color, plans.createdAt)
        .orderBy(desc(plans.createdAt))
        .limit(2),

      // 7. Today's active habits with log status — LIMIT 5
      db
        .select({
          id: habits.id,
          title: habits.title,
          color: habits.color,
          icon: habits.icon,
          frequency: habits.frequency,
          targetDays: habits.targetDays,
          logStatus: sql<string | null>`hl.status`.as('logStatus'),
        })
        .from(habits)
        .leftJoin(
          sql`${habitLogs} hl`,
          sql`hl.habit_id = ${habits.id} AND hl.user_id = ${userId} AND hl.date = ${today}`,
        )
        .where(and(eq(habits.userId, userId), eq(habits.isActive, true)))
        .orderBy(habits.priority)
        .limit(20), // filter in JS after frequency check, then slice to 5

      // 8. Recently added habits — LIMIT 2
      db
        .select({
          id: habits.id,
          title: habits.title,
          color: habits.color,
          icon: habits.icon,
          createdAt: habits.createdAt,
        })
        .from(habits)
        .where(and(eq(habits.userId, userId), eq(habits.isActive, true)))
        .orderBy(desc(habits.createdAt))
        .limit(2),
    ])

    // ── Post-process ─────────────────────────────────────────────────────────

    // Streak
    const streakData = streakRow[0] ?? { current: 0, longest: 0, lastActiveDate: null }

    // Analytics
    const weeklyStudyHours = Math.round((Number(weeklyHoursRow[0]?.total) || 0) * 10) / 10
    const habitsCompletedToday = Number(habitsCompletedRow[0]?.count) || 0
    let remainingExamDays: number | null = null
    if (nearestExamRow[0]?.endDate) {
      const diff = new Date(nearestExamRow[0].endDate).getTime() - now.getTime()
      remainingExamDays = Math.ceil(diff / (1000 * 60 * 60 * 24))
    }

    // Today's topics (already limited to 5 from DB)
    const todaysTopics = todaysTopicsRaw.map(t => ({
      id: t.id,
      title: t.title,
      subtopicTitle: (t as any).parentTitle ?? null,
      planTitle: t.planTitle,
      priority: t.priority,
      estimatedHours: t.estimatedHours,
    }))

    // Recent plans with progress %
    const recentPlans = recentPlansRaw.map(p => ({
      id: p.id,
      title: p.title,
      status: p.status,
      endDate: p.endDate,
      color: p.color,
      progress:
        Number(p.total) > 0
          ? Math.round((Number(p.completed) / Number(p.total)) * 100)
          : 0,
    }))

    // Filter today's habits by frequency, then limit to 5
    const dayIndex = now.getDay() === 0 ? 7 : now.getDay()
    const todaysHabits = todaysHabitsRaw
      .filter(h => {
        if (h.frequency === 'daily') return true
        if (h.frequency === 'weekly' && h.targetDays) return h.targetDays.includes(dayIndex)
        if (h.frequency === 'monthly') return now.getDate() === 1
        return true
      })
      .slice(0, 5)
      .map(h => ({
        id: h.id,
        title: h.title,
        color: h.color,
        icon: h.icon,
        todayStatus: (h as any).logStatus as 'done' | 'missed' | 'skipped' | null,
      }))

    const recentHabits = recentHabitsRaw.map(h => ({
      id: h.id,
      title: h.title,
      color: h.color,
      icon: h.icon,
    }))

    return NextResponse.json(
      {
        streak: {
          current: streakData.current,
          longest: streakData.longest,
          lastActiveDate: streakData.lastActiveDate,
        },
        analytics: {
          weeklyStudyHours,
          habitsCompletedToday,
          remainingExamDays,
        },
        plannerOverview: {
          todaysTopics,
          recentPlans,
        },
        habitOverview: {
          todaysHabits,
          recentHabits,
        },
      },
      {
        headers: {
          'Cache-Control': 'private, max-age=60, stale-while-revalidate=30',
        },
      },
    )
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
  }
}
