import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api/auth-guard'
import { ok, err, badRequest } from '@/lib/api/response'
import { db } from '@/lib/db'
import { habits, habitLogs, streaks } from '@/lib/db/schema'
import { eq, and, desc, gte, lte } from 'drizzle-orm'

/**
 * OPTIMIZED Habits API
 *
 * GET  — List all habits with streaks and 7-day logs
 * POST — Create new habit with initial streak record
 *
 * Professional patterns:
 * - Shared auth guard
 * - 3 parallel queries (habits + streaks + 7-day logs)
 * - Today's logs derived from weekly result (no extra query)
 * - Map-based O(1) lookups for streak & log merging
 * - Transaction for atomic habit + streak creation
 */

export const dynamic = 'force-dynamic'

// ── GET /api/habits ──────────────────────────────────────────────
export async function GET() {
  try {
    const auth = await getAuthUser()
    if (auth instanceof NextResponse) return auth
    const { userId } = auth

    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const sevenDaysAgo = new Date(now)
    sevenDaysAgo.setDate(now.getDate() - 7)
    const weekStart = sevenDaysAgo.toISOString().split('T')[0]

    // ── 3 parallel queries ───────────────────────────────────────
    const [userHabits, habitStreaks, recentLogs] = await Promise.all([
      db
        .select({
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

      db
        .select({
          refId: streaks.refId,
          currentStreak: streaks.currentStreak,
          longestStreak: streaks.longestStreak,
          lastActiveDate: streaks.lastActiveDate,
        })
        .from(streaks)
        .where(and(eq(streaks.userId, userId), eq(streaks.type, 'habit'))),

      db
        .select({
          id: habitLogs.id,
          habitId: habitLogs.habitId,
          date: habitLogs.date,
          status: habitLogs.status,
          note: habitLogs.note,
        })
        .from(habitLogs)
        .where(
          and(
            eq(habitLogs.userId, userId),
            gte(habitLogs.date, weekStart),
            lte(habitLogs.date, today),
          ),
        )
        .orderBy(desc(habitLogs.date)),
    ])

    // ── O(1) lookups ─────────────────────────────────────────────
    const streaksMap = new Map(habitStreaks.map(s => [s.refId, s]))

    const todayLogsMap: Record<string, (typeof recentLogs)[0]> = {}
    const logsByHabit: Record<string, (typeof recentLogs)> = {}

    for (const log of recentLogs) {
      // Derive today's logs from weekly result — zero extra queries
      if (log.date === today) todayLogsMap[log.habitId] = log
        ; (logsByHabit[log.habitId] ??= []).push(log)
    }

    // ── Merge habits + streaks ───────────────────────────────────
    const habitsWithStreaks = userHabits.map(h => {
      const s = streaksMap.get(h.id)
      return {
        ...h,
        currentStreak: s?.currentStreak ?? 0,
        longestStreak: s?.longestStreak ?? 0,
        lastActiveDate: s?.lastActiveDate ?? null,
      }
    })

    return ok({ habits: habitsWithStreaks, todayLogs: todayLogsMap, weeklyLogs: logsByHabit })
  } catch (error) {
    console.error('Habits GET error:', error)
    return err('Failed to fetch habits')
  }
}

// ── POST /api/habits ─────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const auth = await getAuthUser()
    if (auth instanceof NextResponse) return auth
    const { userId } = auth

    const body = await request.json()
    const { title, description, category, frequency, targetDays, timeSlot, priority, color, icon } = body

    if (!title?.trim()) return badRequest('Habit title is required')

    // Atomic: habit + streak in single transaction
    const result = await db.transaction(async tx => {
      const [newHabit] = await tx
        .insert(habits)
        .values({
          userId,
          title: title.trim(),
          description: description?.trim() || null,
          category: category || 'Custom',
          frequency: frequency || 'daily',
          targetDays: targetDays || null,
          timeSlot: timeSlot || null,
          priority: priority || 3,
          color: color || '#7C3AED',
          icon: icon || '🎯',
          isActive: true,
        })
        .returning()

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

    return ok(
      { habit: { ...result, currentStreak: 0, longestStreak: 0 } },
      { status: 201, noCache: true },
    )
  } catch (error) {
    console.error('Habits POST error:', error)
    return err('Failed to create habit')
  }
}
