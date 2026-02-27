import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { habits, habitLogs, streaks } from '@/lib/db/schema'
import { eq, and, gte, lte, desc } from 'drizzle-orm'

/**
 * OPTIMIZED Habit Log API
 * 
 * POST: Toggle habit completion for a date
 * 
 * Performance optimizations:
 * 1. Upsert pattern for efficiency
 * 2. Smart streak calculation
 * 3. Single transaction for atomicity
 */

export const dynamic = 'force-dynamic'

interface Params {
  params: Promise<{ habitId: string }>
}

// POST /api/habits/[habitId]/log - Toggle habit completion
export async function POST(request: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { habitId } = await params
    const userId = session.user.id
    const body = await request.json()

    const { date, status, note } = body
    const logDate = date || new Date().toISOString().split('T')[0]

    // Verify habit ownership
    const [habit] = await db.select({ id: habits.id, frequency: habits.frequency })
      .from(habits)
      .where(and(eq(habits.id, habitId), eq(habits.userId, userId)))
      .limit(1)

    if (!habit) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 })
    }

    // Check for existing log
    const [existingLog] = await db.select()
      .from(habitLogs)
      .where(and(
        eq(habitLogs.habitId, habitId),
        eq(habitLogs.userId, userId),
        eq(habitLogs.date, logDate)
      ))
      .limit(1)

    let resultLog
    let newStatus = status

    // If no status provided, toggle existing or default to 'done'
    if (status === undefined) {
      newStatus = existingLog?.status === 'done' ? 'missed' : 'done'
    }

    // Perform log upsert and streak update in transaction
    const result = await db.transaction(async (tx) => {
      // 1. Upsert habit log
      if (existingLog) {
        // Update existing log
        const [updated] = await tx.update(habitLogs)
          .set({ 
            status: newStatus,
            note: note !== undefined ? note : existingLog.note,
          })
          .where(eq(habitLogs.id, existingLog.id))
          .returning()
        resultLog = updated
      } else {
        // Create new log
        const [created] = await tx.insert(habitLogs).values({
          habitId,
          userId,
          date: logDate,
          status: newStatus,
          note: note || null,
        }).returning()
        resultLog = created
      }

      // 2. Update streak if marking as done
      if (newStatus === 'done') {
        const today = new Date().toISOString().split('T')[0]
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayStr = yesterday.toISOString().split('T')[0]

        // Get current streak record
        const [currentStreak] = await tx.select()
          .from(streaks)
          .where(and(
            eq(streaks.userId, userId),
            eq(streaks.type, 'habit'),
            eq(streaks.refId, habitId)
          ))
          .limit(1)

        if (currentStreak) {
          let newStreakCount = currentStreak.currentStreak

          // Only update streak if marking today or continuing from yesterday
          if (logDate === today || logDate === yesterdayStr) {
            // Check if already logged yesterday for continuity
            const [yesterdayLog] = await tx.select()
              .from(habitLogs)
              .where(and(
                eq(habitLogs.habitId, habitId),
                eq(habitLogs.userId, userId),
                eq(habitLogs.date, yesterdayStr),
                eq(habitLogs.status, 'done')
              ))
              .limit(1)

            if (logDate === today) {
              // If yesterday was done or last active was yesterday, increment
              if (yesterdayLog || currentStreak.lastActiveDate === yesterdayStr) {
                newStreakCount = currentStreak.currentStreak + 1
              } else if (currentStreak.lastActiveDate !== today) {
                // Start new streak
                newStreakCount = 1
              }
            }
          }

          // Update streak
          await tx.update(streaks)
            .set({
              currentStreak: newStreakCount,
              longestStreak: Math.max(currentStreak.longestStreak, newStreakCount),
              lastActiveDate: logDate,
              updatedAt: new Date(),
            })
            .where(eq(streaks.id, currentStreak.id))
        } else {
          // Create streak if doesn't exist
          await tx.insert(streaks).values({
            userId,
            type: 'habit',
            refId: habitId,
            currentStreak: 1,
            longestStreak: 1,
            lastActiveDate: logDate,
          })
        }

        // Also update global streak
        await updateGlobalStreak(tx, userId, logDate)
      }

      return resultLog
    })

    // Get updated streak info
    const [updatedStreak] = await db.select()
      .from(streaks)
      .where(and(
        eq(streaks.userId, userId),
        eq(streaks.type, 'habit'),
        eq(streaks.refId, habitId)
      ))
      .limit(1)

    return NextResponse.json({
      log: result,
      streak: {
        current: updatedStreak?.currentStreak || 0,
        longest: updatedStreak?.longestStreak || 0,
      },
    })
  } catch (error) {
    console.error('Habit log POST error:', error)
    return NextResponse.json({ error: 'Failed to log habit' }, { status: 500 })
  }
}

// Helper to update global streak
async function updateGlobalStreak(tx: any, userId: string, date: string) {
  const [globalStreak] = await tx.select()
    .from(streaks)
    .where(and(
      eq(streaks.userId, userId),
      eq(streaks.type, 'global')
    ))
    .limit(1)

  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  if (globalStreak) {
    let newGlobalStreak = globalStreak.currentStreak

    // Check if last active was yesterday or today for continuity
    if (globalStreak.lastActiveDate === yesterdayStr && date === today) {
      newGlobalStreak = globalStreak.currentStreak + 1
    } else if (globalStreak.lastActiveDate !== today && date === today) {
      // Start new streak if breaking the chain
      if (globalStreak.lastActiveDate !== yesterdayStr) {
        newGlobalStreak = 1
      } else {
        newGlobalStreak = globalStreak.currentStreak + 1
      }
    }

    await tx.update(streaks)
      .set({
        currentStreak: newGlobalStreak,
        longestStreak: Math.max(globalStreak.longestStreak, newGlobalStreak),
        lastActiveDate: date,
        updatedAt: new Date(),
      })
      .where(eq(streaks.id, globalStreak.id))
  } else {
    // Create global streak
    await tx.insert(streaks).values({
      userId,
      type: 'global',
      refId: null,
      currentStreak: 1,
      longestStreak: 1,
      lastActiveDate: date,
    })
  }
}

// GET /api/habits/[habitId]/log - Get habit logs for date range
export async function GET(request: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { habitId } = await params
    const userId = session.user.id
    const { searchParams } = new URL(request.url)
    
    // Default to last 30 days
    const endDate = searchParams.get('endDate') || new Date().toISOString().split('T')[0]
    const startDate = searchParams.get('startDate') || (() => {
      const d = new Date()
      d.setDate(d.getDate() - 30)
      return d.toISOString().split('T')[0]
    })()

    // Verify habit ownership
    const [habit] = await db.select({ id: habits.id })
      .from(habits)
      .where(and(eq(habits.id, habitId), eq(habits.userId, userId)))
      .limit(1)

    if (!habit) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 })
    }

    // Get logs for date range
    const logs = await db.select()
      .from(habitLogs)
      .where(and(
        eq(habitLogs.habitId, habitId),
        eq(habitLogs.userId, userId),
        gte(habitLogs.date, startDate),
        lte(habitLogs.date, endDate)
      ))
      .orderBy(desc(habitLogs.date))

    return NextResponse.json({ logs })
  } catch (error) {
    console.error('Habit logs GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 })
  }
}
