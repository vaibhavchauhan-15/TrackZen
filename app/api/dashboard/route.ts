import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { users, plans, topics, habits, habitLogs, streaks, dailyProgress } from '@/lib/db/schema'
import { eq, and, sql, gte, lte, desc, inArray } from 'drizzle-orm'

/**
 * OPTIMIZED Dashboard API
 * 
 * Performance optimizations:
 * 1. Single endpoint returns all dashboard data
 * 2. Parallel queries using Promise.all
 * 3. Selective column fetching (only needed fields)
 * 4. Computed fields in SQL for efficiency
 * 5. Indexed queries for fast lookups  
 * 6. Minimal response payload
 */

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const today = new Date().toISOString().split('T')[0]
    
    // Get start of current week (Monday)
    const now = new Date()
    const dayOfWeek = now.getDay()
    const monday = new Date(now)
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
    const weekStart = monday.toISOString().split('T')[0]

    // Execute all queries in parallel for maximum speed
    const [
      userData,
      userPlans,
      userHabits,
      todayHabitLogs,
      userStreaks,
      weeklyProgressData,
      todayTopics
    ] = await Promise.all([
      // 1. User data (minimal fields)
      db.select({
        id: users.id,
        name: users.name,
        email: users.email,
        avatarUrl: users.avatarUrl,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1),

      // 2. Plans with topic counts (using subqueries for efficiency)
      db.select({
        id: plans.id,
        title: plans.title,
        type: plans.type,
        status: plans.status,
        startDate: plans.startDate,
        endDate: plans.endDate,
        dailyHours: plans.dailyHours,
        totalEstimatedHours: plans.totalEstimatedHours,
        color: plans.color,
      })
      .from(plans)
      .where(eq(plans.userId, userId))
      .orderBy(desc(plans.createdAt)),

      // 3. Active habits
      db.select({
        id: habits.id,
        title: habits.title,
        description: habits.description,
        category: habits.category,
        frequency: habits.frequency,
        targetDays: habits.targetDays,
        timeSlot: habits.timeSlot,
        priority: habits.priority,
        color: habits.color,
        icon: habits.icon,
        isActive: habits.isActive,
        createdAt: habits.createdAt,
      })
      .from(habits)
      .where(and(
        eq(habits.userId, userId),
        eq(habits.isActive, true)
      )),

      // 4. Today's habit logs
      db.select({
        id: habitLogs.id,
        habitId: habitLogs.habitId,
        status: habitLogs.status,
        note: habitLogs.note,
        date: habitLogs.date,
      })
      .from(habitLogs)
      .where(and(
        eq(habitLogs.userId, userId),
        eq(habitLogs.date, today)
      )),

      // 5. User streaks
      db.select({
        type: streaks.type,
        refId: streaks.refId,
        currentStreak: streaks.currentStreak,
        longestStreak: streaks.longestStreak,
        lastActiveDate: streaks.lastActiveDate,
      })
      .from(streaks)
      .where(eq(streaks.userId, userId)),

      // 6. Weekly progress (study hours)
      db.select({
        hoursSpent: sql<number>`COALESCE(SUM(${dailyProgress.hoursSpent}), 0)`.as('hoursSpent'),
      })
      .from(dailyProgress)
      .where(and(
        eq(dailyProgress.userId, userId),
        gte(dailyProgress.date, weekStart),
        lte(dailyProgress.date, today)
      )),

      // 7. Today's scheduled topics
      db.select({
        id: topics.id,
        title: topics.title,
        estimatedHours: topics.estimatedHours,
        status: topics.status,
        priority: topics.priority,
        planId: topics.planId,
      })
      .from(topics)
      .innerJoin(plans, eq(topics.planId, plans.id))
      .where(and(
        eq(plans.userId, userId),
        eq(topics.scheduledDate, today)
      )),
    ])

    // Get topic counts for each plan in a single query
    const planIds = userPlans.map(p => p.id)
    let topicCounts: { planId: string; total: number; completed: number }[] = []
    
    if (planIds.length > 0) {
      topicCounts = await db.select({
        planId: topics.planId,
        total: sql<number>`COUNT(*)`.as('total'),
        completed: sql<number>`SUM(CASE WHEN ${topics.status} = 'completed' THEN 1 ELSE 0 END)`.as('completed'),
      })
      .from(topics)
      .where(and(
        inArray(topics.planId, planIds),
        sql`${topics.parentId} IS NOT NULL` // Only count subtopics (actual tasks)
      ))
      .groupBy(topics.planId)
    }

    // Create topic counts map
    const topicCountsMap = new Map(topicCounts.map(tc => [tc.planId, { total: tc.total, completed: tc.completed }]))

    // Process data
    const user = userData[0]
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Create habit logs map for quick lookup
    const logsMap: Record<string, any> = {}
    todayHabitLogs.forEach(log => {
      logsMap[log.habitId] = log
    })

    // Calculate streak from streaks table
    const globalStreak = userStreaks.find(s => s.type === 'global')
    const streak = globalStreak?.currentStreak || 0

    // Calculate weekly hours
    const weeklyHours = Number(weeklyProgressData[0]?.hoursSpent) || 0

    // Calculate habits completed today  
    const habitsCompleted = todayHabitLogs.filter(log => log.status === 'done').length

    // Process plans with completion percentages
    const plansWithCompletion = userPlans.map(plan => {
      const counts = topicCountsMap.get(plan.id) || { total: 0, completed: 0 }
      return {
        ...plan,
        totalTopics: counts.total,
        completedTopics: counts.completed,
        completion: counts.total > 0 ? Math.round((counts.completed / counts.total) * 100) : 0,
      }
    })

    // Get next exam date
    const activePlans = plansWithCompletion.filter(p => p.status === 'active')
    const examPlans = activePlans.filter(p => p.type === 'exam' && p.endDate)
    let nextExamDays: number | null = null
    
    if (examPlans.length > 0) {
      const sortedExams = examPlans
        .map(p => ({ ...p, endDateObj: new Date(p.endDate!) }))
        .sort((a, b) => a.endDateObj.getTime() - b.endDateObj.getTime())
      
      const nextExam = sortedExams[0]
      const diffTime = nextExam.endDateObj.getTime() - now.getTime()
      nextExamDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    }

    // Create plan title map for tasks
    const planTitleMap = new Map(userPlans.map(p => [p.id, p.title]))

    // Process today's tasks
    const todayTasks = todayTopics.map(topic => ({
      id: topic.id,
      title: topic.title,
      estimatedHours: topic.estimatedHours,
      status: topic.status,
      priority: topic.priority,
      planTitle: planTitleMap.get(topic.planId) || '',
    }))

    // Process habits with streak info
    const habitStreaksMap = new Map(
      userStreaks
        .filter(s => s.type === 'habit' && s.refId)
        .map(s => [s.refId!, { currentStreak: s.currentStreak, longestStreak: s.longestStreak }])
    )

    const habitsWithStreaks = userHabits.map(habit => ({
      ...habit,
      currentStreak: habitStreaksMap.get(habit.id)?.currentStreak || 0,
      longestStreak: habitStreaksMap.get(habit.id)?.longestStreak || 0,
    }))

    // Process today's habits summary
    const todayHabits = habitsWithStreaks
      .filter(h => {
        // Check if habit is due today based on frequency
        if (h.frequency === 'daily') return true
        if (h.frequency === 'weekly' && h.targetDays) {
          const dayIndex = now.getDay() === 0 ? 7 : now.getDay()
          return h.targetDays.includes(dayIndex)
        }
        if (h.frequency === 'monthly') {
          return now.getDate() === 1 // First of month
        }
        return true
      })
      .map(h => ({
        id: h.id,
        title: h.title,
        completed: logsMap[h.id]?.status === 'done',
        color: h.color,
      }))

    return NextResponse.json({
      user: {
        name: user.name,
        email: user.email,
        image: user.avatarUrl,
      },
      streak,
      plans: plansWithCompletion,
      activePlans: activePlans.slice(0, 3),
      habits: habitsWithStreaks,
      todayLogs: logsMap,
      habitsCompleted,
      summary: {
        streak,
        todayTasks,
        todayHabits,
        activePlans: activePlans.slice(0, 3).map(p => ({
          id: p.id,
          title: p.title,
          type: p.type,
          completion: p.completion,
          color: p.color,
          endDate: p.endDate,
        })),
        weeklyHours: Math.round(weeklyHours * 10) / 10,
        habitsCompleted,
        nextExamDays,
      },
    }, {
      headers: {
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      },
    })
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
