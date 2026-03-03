import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
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
 */

export const dynamic = 'force-dynamic'

interface Params {
  params: Promise<{ habitId: string }>
}

export async function POST(request: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { habitId } = await params
    const userId = session.user.id

    // Parse date from body, default to today
    const body = await request.json().catch(() => ({}))
    const date: string = body.date ?? new Date().toISOString().split('T')[0]

    // Single query: verify ownership AND check for existing log via LEFT JOIN.
    // Reduces 2 serial round-trips to 1.
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

    if (!row) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 })
    }

    const existing = row.logId ? { id: row.logId, status: row.logStatus } : null

    let newStatus: 'done' | null = null

    if (!existing) {
      // No log — mark as done
      await db.insert(habitLogs).values({
        habitId,
        userId,
        date,
        status: 'done',
      })
      newStatus = 'done'
    } else if (existing.status === 'done') {
      // Already done — un-mark (delete log)
      await db
        .delete(habitLogs)
        .where(eq(habitLogs.id, existing.id))
      newStatus = null
    } else {
      // Other status (missed/skipped) — update to done
      await db
        .update(habitLogs)
        .set({ status: 'done' })
        .where(eq(habitLogs.id, existing.id))
      newStatus = 'done'
    }

    // Update habit streak
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
        if (streak) {
          const lastActive = streak.lastActiveDate
          const yesterday = new Date()
          yesterday.setDate(yesterday.getDate() - 1)
          const yesterdayStr = yesterday.toISOString().split('T')[0]

          const newCurrent =
            lastActive === today
              ? streak.currentStreak
              : lastActive === yesterdayStr
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
        // Un-marked → decrement streak (treat lastActiveDate as yesterday or reset)
        if (streak) {
          const newCurrent = Math.max(0, streak.currentStreak - 1)
          await db
            .update(streaks)
            .set({
              currentStreak: newCurrent,
              lastActiveDate: newCurrent > 0
                ? (() => {
                  const d = new Date()
                  d.setDate(d.getDate() - 1)
                  return d.toISOString().split('T')[0]
                })()
                : null,
            })
            .where(eq(streaks.id, streak.id))
          returnedStreak = { currentStreak: newCurrent, longestStreak: streak.longestStreak }
        } else {
          returnedStreak = { currentStreak: 0, longestStreak: 0 }
        }
      }
    }

    return NextResponse.json({ status: newStatus, streak: returnedStreak })
  } catch (error) {
    console.error('Habit log POST error:', error)
    return NextResponse.json({ error: 'Failed to toggle habit log' }, { status: 500 })
  }
}
