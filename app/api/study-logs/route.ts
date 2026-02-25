import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { dailyStudyLogs, users } from '@/lib/db/schema'
import { eq, and, desc, gte, lte } from 'drizzle-orm'

// GET - Fetch daily study logs
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user
    const userResult = await db.select().from(users).where(eq(users.email, session.user.email)).limit(1)
    if (userResult.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    const user = userResult[0]

    // Get query params
    const searchParams = req.nextUrl.searchParams
    const planId = searchParams.get('planId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Build query conditions
    let conditions = [eq(dailyStudyLogs.userId, user.id)]
    if (planId) {
      conditions.push(eq(dailyStudyLogs.planId, planId))
    }
    if (startDate) {
      conditions.push(gte(dailyStudyLogs.date, startDate))
    }
    if (endDate) {
      conditions.push(lte(dailyStudyLogs.date, endDate))
    }

    const logs = await db
      .select()
      .from(dailyStudyLogs)
      .where(and(...conditions))
      .orderBy(desc(dailyStudyLogs.date))

    return NextResponse.json(logs)
  } catch (error) {
    console.error('Error fetching daily study logs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create a new daily study log
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user
    const userResult = await db.select().from(users).where(eq(users.email, session.user.email)).limit(1)
    if (userResult.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    const user = userResult[0]

    const body = await req.json()
    const { planId, date, plannedHours, actualHours, topicsCompleted, revisionDone, notes } = body

    // Validate required fields
    if (!planId || !date) {
      return NextResponse.json({ error: 'Plan ID and date are required' }, { status: 400 })
    }

    // Create study log
    const newLog = await db
      .insert(dailyStudyLogs)
      .values({
        userId: user.id,
        planId,
        date,
        plannedHours: plannedHours || 0,
        actualHours: actualHours || 0,
        topicsCompleted: topicsCompleted || 0,
        revisionDone: revisionDone || false,
        notes,
      })
      .returning()

    return NextResponse.json(newLog[0], { status: 201 })
  } catch (error) {
    console.error('Error creating daily study log:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update an existing daily study log
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userResult = await db.select().from(users).where(eq(users.email, session.user.email)).limit(1)
    if (userResult.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    const user = userResult[0]

    const body = await req.json()
    const { id, plannedHours, actualHours, topicsCompleted, revisionDone, notes } = body

    if (!id) {
      return NextResponse.json({ error: 'Log ID is required' }, { status: 400 })
    }

    const updatedLog = await db
      .update(dailyStudyLogs)
      .set({
        plannedHours,
        actualHours,
        topicsCompleted,
        revisionDone,
        notes,
      })
      .where(and(eq(dailyStudyLogs.id, id), eq(dailyStudyLogs.userId, user.id)))
      .returning()

    if (updatedLog.length === 0) {
      return NextResponse.json({ error: 'Log not found' }, { status: 404 })
    }

    return NextResponse.json(updatedLog[0])
  } catch (error) {
    console.error('Error updating daily study log:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
