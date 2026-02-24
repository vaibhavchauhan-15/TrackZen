import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { habits, users, habitLogs } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db.select().from(users).where(eq(users.email, session.user.email)).limit(1)
    if (!user.length) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get all habits
    const userHabits = await db
      .select()
      .from(habits)
      .where(and(eq(habits.userId, user[0].id), eq(habits.isActive, true)))

    // Get today's logs
    const today = new Date().toISOString().split('T')[0]
    const todayLogsData = await db
      .select()
      .from(habitLogs)
      .where(and(eq(habitLogs.userId, user[0].id), eq(habitLogs.date, today)))

    const todayLogs: Record<string, any> = {}
    todayLogsData.forEach((log) => {
      todayLogs[log.habitId] = log
    })

    return NextResponse.json({ habits: userHabits, todayLogs })
  } catch (error) {
    console.error('Error fetching habits:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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
    const { title, category, frequency, targetDays, color, icon } = body

    const [newHabit] = await db
      .insert(habits)
      .values({
        userId: user[0].id,
        title,
        category: category || 'Custom',
        frequency: frequency || 'daily',
        targetDays: targetDays || null,
        color: color || '#7C3AED',
        icon: icon || 'target',
        isActive: true,
      })
      .returning()

    return NextResponse.json({ habit: newHabit }, { status: 201 })
  } catch (error) {
    console.error('Error creating habit:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
