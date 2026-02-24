import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { habitLogs, users } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { calculateHabitStreak, calculateGlobalStreak } from '@/lib/streak'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db.select().from(users).where(eq(users.email, session.user.email)).limit(1)
    if (!user.length) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await req.json()
    const { habitId, status, date, note } = body

    // Check if log exists for this date
    const existingLog = await db
      .select()
      .from(habitLogs)
      .where(
        and(
          eq(habitLogs.habitId, habitId),
          eq(habitLogs.userId, user[0].id),
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
          userId: user[0].id,
          date,
          status,
          note: note || null,
        })
        .returning()
    }

    // Recalculate streaks
    await calculateHabitStreak(habitId, user[0].id)
    await calculateGlobalStreak(user[0].id)

    return NextResponse.json({ success: true, log })
  } catch (error) {
    console.error('Error logging habit:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
