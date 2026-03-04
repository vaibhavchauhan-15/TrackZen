import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api/auth-guard'
import { ok, err, notFound } from '@/lib/api/response'
import { db } from '@/lib/db'
import { habits, habitLogs, streaks } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

/**
 * Habit Log API — Toggle habit completion for a given date
 *
 * POST /api/habits/[habitId]/log
 * Body: { date?: string }  — defaults to today
 *
 * Behaviour:
 *   no log        → create with status 'done'
 *   status 'done' → delete log (un-mark)
 *   other status  → update to 'done'
 *
 * Professional patterns:
 * - Single JOIN query to verify ownership + check existing log
 * - Streak update uses cached date strings (avoid repeated toISOString)
 * - Minimal branching with early returns
 */

export const dynamic = 'force-dynamic'

interface Params {
  params: Promise<{ habitId: string }>
}

export async function POST(request: Request, { params }: Params) {
  try {
    const auth = await getAuthUser()
    if (auth instanceof NextResponse) return auth
    const { userId } = auth
    const { habitId } = await params

    // Parse date from body, default to today
    const body = await request.json().catch(() => ({}))
    const date: string = body.date ?? new Date().toISOString().split('T')[0]

    // Single JOIN: ownership check + existing log lookup in 1 round-trip
    const [row] = await db
      .select({
        habitExists: habits.id,
        logId: habitLogs.id,
        logStatus: habitLogs.status,
      })
      .from(habits)
      .leftJoin(
        habitLogs,
        and(
          eq(habitLogs.habitId, habitId),
          eq(habitLogs.userId, userId),
          eq(habitLogs.date, date),
        ),
      )
      .where(and(eq(habits.id, habitId), eq(habits.userId, userId)))
      .limit(1)

    if (!row) return notFound('Habit not found')

    const existing = row.logId ? { id: row.logId, status: row.logStatus } : null
    let newStatus: 'done' | null = null

    if (!existing) {
      // No log → mark as done
      await db.insert(habitLogs).values({ habitId, userId, date, status: 'done' })
      newStatus = 'done'
    } else if (existing.status === 'done') {
      // Already done → un-mark
      await db.delete(habitLogs).where(eq(habitLogs.id, existing.id))
      newStatus = null
    } else {
      // Other status → update to done
      await db
        .update(habitLogs)
        .set({ status: 'done' })
        .where(eq(habitLogs.id, existing.id))
      newStatus = 'done'
    }

    // ── Update streak (only when toggling today's date) ──────────
    const today = new Date().toISOString().split('T')[0]
    let returnedStreak: { currentStreak: number; longestStreak: number } | null = null

    if (date === today) {
      const [streak] = await db
        .select()
        .from(streaks)
        .where(
          and(
            eq(streaks.userId, userId),
            eq(streaks.type, 'habit'),
            eq(streaks.refId, habitId),
          ),
        )
        .limit(1)

      if (newStatus === 'done') {
        // Marking done — increment or create streak
        if (streak) {
          const yesterdayStr = getYesterdayStr()
          const newCurrent =
            streak.lastActiveDate === today
              ? streak.currentStreak
              : streak.lastActiveDate === yesterdayStr
                ? streak.currentStreak + 1
                : 1
          const newLongest = Math.max(streak.longestStreak, newCurrent)

          await db
            .update(streaks)
            .set({ currentStreak: newCurrent, longestStreak: newLongest, lastActiveDate: today })
            .where(eq(streaks.id, streak.id))

          returnedStreak = { currentStreak: newCurrent, longestStreak: newLongest }
        } else {
          await db.insert(streaks).values({
            userId,
            type: 'habit',
            refId: habitId,
            currentStreak: 1,
            longestStreak: 1,
            lastActiveDate: today,
          })
          returnedStreak = { currentStreak: 1, longestStreak: 1 }
        }
      } else {
        // Un-marking → decrement
        if (streak) {
          const newCurrent = Math.max(0, streak.currentStreak - 1)
          await db
            .update(streaks)
            .set({
              currentStreak: newCurrent,
              lastActiveDate: newCurrent > 0 ? getYesterdayStr() : null,
            })
            .where(eq(streaks.id, streak.id))
          returnedStreak = { currentStreak: newCurrent, longestStreak: streak.longestStreak }
        } else {
          returnedStreak = { currentStreak: 0, longestStreak: 0 }
        }
      }
    }

    return ok({ status: newStatus, streak: returnedStreak }, { noCache: true })
  } catch (error) {
    console.error('Habit log POST error:', error)
    return err('Failed to toggle habit log')
  }
}

/** Cache-friendly yesterday string — avoids inline IIFE. */
function getYesterdayStr(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().split('T')[0]
}
