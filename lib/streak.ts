import { db } from './db'
import { streaks, dailyProgress, habitLogs } from './db/schema'
import { eq, and } from 'drizzle-orm'

export async function calculateGlobalStreak(userId: string): Promise<number> {
  const today = new Date().toISOString().split('T')[0]
  
  // Get user's global streak
  const userStreaks = await db
    .select()
    .from(streaks)
    .where(and(eq(streaks.userId, userId), eq(streaks.type, 'global')))
    .limit(1)

  if (userStreaks.length === 0) {
    // Create initial streak record
    await db.insert(streaks).values({
      userId,
      type: 'global',
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: today,
    })
    return 0
  }

  const streak = userStreaks[0]
  const lastActive = streak.lastActiveDate

  if (!lastActive) return 0

  // Check if there's activity today
  const hasActivityToday = await checkActivityToday(userId, today)

  if (hasActivityToday) {
    // Check if already updated today
    if (lastActive === today) {
      return streak.currentStreak
    }

    // Check if yesterday had activity (continuous streak)
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    if (lastActive === yesterdayStr) {
      // Continue streak
      const newStreak = streak.currentStreak + 1
      const newLongest = Math.max(newStreak, streak.longestStreak)

      await db
        .update(streaks)
        .set({
          currentStreak: newStreak,
          longestStreak: newLongest,
          lastActiveDate: today,
          updatedAt: new Date(),
        })
        .where(eq(streaks.id, streak.id))

      return newStreak
    } else {
      // Streak broken, restart
      await db
        .update(streaks)
        .set({
          currentStreak: 1,
          lastActiveDate: today,
          updatedAt: new Date(),
        })
        .where(eq(streaks.id, streak.id))

      return 1
    }
  }

  // No activity today, check if streak is broken
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  if (lastActive < yesterdayStr) {
    // Streak is broken
    await db
      .update(streaks)
      .set({
        currentStreak: 0,
        updatedAt: new Date(),
      })
      .where(eq(streaks.id, streak.id))

    return 0
  }

  return streak.currentStreak
}

async function checkActivityToday(userId: string, date: string): Promise<boolean> {
  // Check study progress
  const studyActivity = await db
    .select()
    .from(dailyProgress)
    .where(and(eq(dailyProgress.userId, userId), eq(dailyProgress.date, date)))
    .limit(1)

  if (studyActivity.length > 0) return true

  // Check habit logs
  const habitActivity = await db
    .select()
    .from(habitLogs)
    .where(and(eq(habitLogs.userId, userId), eq(habitLogs.date, date)))
    .limit(1)

  return habitActivity.length > 0
}

export async function calculateHabitStreak(habitId: string, userId: string): Promise<number> {
  const today = new Date().toISOString().split('T')[0]

  // Get habit streak
  const habitStreaks = await db
    .select()
    .from(streaks)
    .where(
      and(
        eq(streaks.userId, userId),
        eq(streaks.type, 'habit'),
        eq(streaks.refId, habitId)
      )
    )
    .limit(1)

  if (habitStreaks.length === 0) {
    // Create initial streak
    await db.insert(streaks).values({
      userId,
      type: 'habit',
      refId: habitId,
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: today,
    })
    return 0
  }

  const streak = habitStreaks[0]

  // Check today's log
  const todayLog = await db
    .select()
    .from(habitLogs)
    .where(
      and(
        eq(habitLogs.habitId, habitId),
        eq(habitLogs.userId, userId),
        eq(habitLogs.date, today)
      )
    )
    .limit(1)

  if (todayLog.length > 0 && todayLog[0].status === 'done') {
    if (streak.lastActiveDate === today) {
      return streak.currentStreak
    }

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    if (streak.lastActiveDate === yesterdayStr) {
      const newStreak = streak.currentStreak + 1
      const newLongest = Math.max(newStreak, streak.longestStreak)

      await db
        .update(streaks)
        .set({
          currentStreak: newStreak,
          longestStreak: newLongest,
          lastActiveDate: today,
          updatedAt: new Date(),
        })
        .where(eq(streaks.id, streak.id))

      return newStreak
    } else {
      await db
        .update(streaks)
        .set({
          currentStreak: 1,
          lastActiveDate: today,
          updatedAt: new Date(),
        })
        .where(eq(streaks.id, streak.id))

      return 1
    }
  }

  return streak.currentStreak
}
