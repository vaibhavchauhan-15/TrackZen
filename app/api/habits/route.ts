import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { habits, habitLogs, streaks } from '@/lib/db/schema'
import { eq, and, desc, gte, lte, sql } from 'drizzle-orm'

/**
 * OPTIMIZED Habits API
 * 
 * GET: List all habits with streaks and recent logs
 * POST: Create new habit with initial streak
 * 
 * Performance optimizations:
 * 1. Parallel queries for habits and streaks
 * 2. Batch operations
 * 3. Efficient streak lookup
 */

export const dynamic = 'force-dynamic'

// GET /api/habits - List all habits with streaks
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const today = new Date().toISOString().split('T')[0]
    
    // Get last 7 days for weekly overview
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const weekStart = sevenDaysAgo.toISOString().split('T')[0]

    // Parallel queries
    const [userHabits, habitStreaks, recentLogs, todayLogs] = await Promise.all([
      // 1. Get all habits
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
      .where(eq(habits.userId, userId))
      .orderBy(desc(habits.createdAt)),

      // 2. Get all habit streaks
      db.select({
        refId: streaks.refId,
        currentStreak: streaks.currentStreak,
        longestStreak: streaks.longestStreak,
        lastActiveDate: streaks.lastActiveDate,
      })
      .from(streaks)
      .where(and(
        eq(streaks.userId, userId),
        eq(streaks.type, 'habit')
      )),

      // 3. Get logs for last 7 days
      db.select({
        id: habitLogs.id,
        habitId: habitLogs.habitId,
        date: habitLogs.date,
        status: habitLogs.status,
        note: habitLogs.note,
      })
      .from(habitLogs)
      .where(and(
        eq(habitLogs.userId, userId),
        gte(habitLogs.date, weekStart),
        lte(habitLogs.date, today)
      ))
      .orderBy(desc(habitLogs.date)),

      // 4. Today's logs specifically (for quick access)
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
    ])

    // Create lookup maps
    const streaksMap = new Map(habitStreaks.map(s => [s.refId, s]))
    const todayLogsMap: Record<string, any> = {}
    todayLogs.forEach(log => {
      todayLogsMap[log.habitId] = log
    })

    // Combine habits with streaks
    const habitsWithStreaks = userHabits.map(habit => ({
      ...habit,
      currentStreak: streaksMap.get(habit.id)?.currentStreak || 0,
      longestStreak: streaksMap.get(habit.id)?.longestStreak || 0,
      lastActiveDate: streaksMap.get(habit.id)?.lastActiveDate || null,
    }))

    // Group logs by habit for weekly overview
    const logsByHabit: Record<string, any[]> = {}
    recentLogs.forEach(log => {
      if (!logsByHabit[log.habitId]) {
        logsByHabit[log.habitId] = []
      }
      logsByHabit[log.habitId].push(log)
    })

    return NextResponse.json({
      habits: habitsWithStreaks,
      todayLogs: todayLogsMap,
      weeklyLogs: logsByHabit,
    })
  } catch (error) {
    console.error('Habits GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch habits' }, { status: 500 })
  }
}

// POST /api/habits - Create new habit
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const body = await request.json()

    const { title, description, category, frequency, targetDays, timeSlot, priority, color, icon } = body

    // Validation
    if (!title?.trim()) {
      return NextResponse.json({ error: 'Habit title is required' }, { status: 400 })
    }

    // Create habit and streak in transaction
    const result = await db.transaction(async (tx) => {
      // 1. Create habit
      const [newHabit] = await tx.insert(habits).values({
        userId,
        title: title.trim(),
        description: description?.trim() || null,
        category: category || 'Custom',
        frequency: frequency || 'daily',
        targetDays: targetDays || null,
        timeSlot: timeSlot || null,
        priority: priority || 3,
        color: color || '#7C3AED',
        icon: icon || 'target',
        isActive: true,
      }).returning()

      // 2. Create initial streak record
      await tx.insert(streaks).values({
        userId,
        type: 'habit',
        refId: newHabit.id,
        currentStreak: 0,
        longestStreak: 0,
        lastActiveDate: null,
      })

      return newHabit
    })

    return NextResponse.json({
      habit: {
        ...result,
        currentStreak: 0,
        longestStreak: 0,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Habits POST error:', error)
    return NextResponse.json({ error: 'Failed to create habit' }, { status: 500 })
  }
}
