import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { habits, users, habitLogs } from '@/lib/db/schema'
import { eq, and, asc } from 'drizzle-orm'
import { withAuth, CacheHeaders } from '@/lib/api-helpers'

export async function GET(req: NextRequest) {
  return withAuth(async (user) => {
    const today = new Date().toISOString().split('T')[0]

    // OPTIMIZATION: Fetch habits and logs in parallel
    const [userHabits, todayLogsData] = await Promise.all([
      db
        .select()
        .from(habits)
        .where(and(eq(habits.userId, user.id), eq(habits.isActive, true)))
        .orderBy(asc(habits.priority)),
      db
        .select()
        .from(habitLogs)
        .where(and(eq(habitLogs.userId, user.id), eq(habitLogs.date, today)))
    ])

    const todayLogs: Record<string, any> = {}
    todayLogsData.forEach((log) => {
      todayLogs[log.habitId] = log
    })

    return NextResponse.json({ habits: userHabits, todayLogs }, { headers: CacheHeaders.short })
  })
}

export async function POST(req: NextRequest) {
  return withAuth(async (user) => {
    const body = await req.json()
    const { title, description, category, frequency, targetDays, timeSlot, priority, color, icon } = body

    const [newHabit] = await db
      .insert(habits)
      .values({
        userId: user.id,
        title,
        description: description || null,
        category: category || 'Custom',
        frequency: frequency || 'daily',
        targetDays: targetDays || null,
        timeSlot: timeSlot || null,
        priority: priority || 3,
        color: color || '#7C3AED',
        icon: icon || 'target',
        isActive: true,
      })
      .returning()

    return NextResponse.json({ habit: newHabit }, { status: 201 })
  })
}
