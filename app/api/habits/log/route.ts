import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { habitLogs, users } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { calculateHabitStreak, calculateGlobalStreak } from '@/lib/streak'
import { withAuth } from '@/lib/api-helpers'

export async function POST(req: NextRequest) {
  return withAuth(async (user) => {
    const body = await req.json()
    const { habitId, status, date, note } = body

    // Check if log exists for this date
    const existingLog = await db
      .select()
      .from(habitLogs)
      .where(
        and(
          eq(habitLogs.habitId, habitId),
          eq(habitLogs.userId, user.id),
          eq(habitLogs.date, date)
        )
      )
      .limit(1)

    let log
    if (existingLog.length > 0) {
      // Update existing log
      [log] = await db
        .update(habitLogs)
        .set({ status, note })
        .where(eq(habitLogs.id, existingLog[0].id))
        .returning()
    } else {
      // Create new log
      [log] = await db
        .insert(habitLogs)
        .values({
          habitId,
          userId: user.id,
          date,
          status,
          note: note || null,
        })
        .returning()
    }

    // OPTIMIZATION: Only recalculate streaks if status changed to 'done' or from 'done'
    // This avoids unnecessary calculations on every update
    const statusChanged = !existingLog[0] || existingLog[0].status !== status
    const affectsStreak = status === 'done' || (existingLog[0] && existingLog[0].status === 'done')
    
    if (statusChanged && affectsStreak) {
      // Run streak calculations in parallel (don't await - fire and forget for speed)
      Promise.all([
        calculateHabitStreak(habitId, user.id),
        calculateGlobalStreak(user.id)
      ]).catch(err => console.error('Streak calculation error:', err))
    }

    return NextResponse.json({ success: true, log })
  })
}
