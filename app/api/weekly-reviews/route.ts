import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { weeklyReviews, users, dailyStudyLogs, mockTests } from '@/lib/db/schema'
import { eq, and, desc, gte, lte, sql } from 'drizzle-orm'

// GET - Fetch weekly reviews
export async function GET(req: NextRequest) {
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

    const searchParams = req.nextUrl.searchParams
    const planId = searchParams.get('planId')

    let conditions = [eq(weeklyReviews.userId, user.id)]
    if (planId) {
      conditions.push(eq(weeklyReviews.planId, planId))
    }

    const reviews = await db
      .select()
      .from(weeklyReviews)
      .where(and(...conditions))
      .orderBy(desc(weeklyReviews.weekStartDate))

    return NextResponse.json(reviews)
  } catch (error) {
    console.error('Error fetching weekly reviews:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create a weekly review (with auto-calculation)
export async function POST(req: NextRequest) {
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
    const { 
      planId, 
      weekStartDate, 
      weekEndDate,
      weakAreas,
      achievements,
      adjustments,
      reflection
    } = body

    if (!planId || !weekStartDate || !weekEndDate) {
      return NextResponse.json({ error: 'Plan ID, week start date, and week end date are required' }, { status: 400 })
    }

    // Calculate statistics from daily study logs
    const studyLogs = await db
      .select()
      .from(dailyStudyLogs)
      .where(
        and(
          eq(dailyStudyLogs.userId, user.id),
          eq(dailyStudyLogs.planId, planId),
          gte(dailyStudyLogs.date, weekStartDate),
          lte(dailyStudyLogs.date, weekEndDate)
        )
      )

    const plannedHours = studyLogs.reduce((sum, log) => sum + (log.plannedHours || 0), 0)
    const actualHours = studyLogs.reduce((sum, log) => sum + (log.actualHours || 0), 0)
    const topicsCompleted = studyLogs.reduce((sum, log) => sum + (log.topicsCompleted || 0), 0)

    // Calculate mock test stats
    const tests = await db
      .select()
      .from(mockTests)
      .where(
        and(
          eq(mockTests.userId, user.id),
          eq(mockTests.planId, planId),
          gte(mockTests.testDate, weekStartDate),
          lte(mockTests.testDate, weekEndDate),
          eq(mockTests.status, 'completed')
        )
      )

    const mockTestsTaken = tests.length
    const averageAccuracy = tests.length > 0
      ? tests.reduce((sum, test) => sum + (test.accuracy || 0), 0) / tests.length
      : null

    const newReview = await db
      .insert(weeklyReviews)
      .values({
        userId: user.id,
        planId,
        weekStartDate,
        weekEndDate,
        plannedHours,
        actualHours,
        topicsPlanned: 0, // User should manually set this
        topicsCompleted,
        mockTestsTaken,
        averageAccuracy,
        weakAreas: weakAreas || [],
        achievements: achievements || [],
        adjustments,
        reflection,
      })
      .returning()

    return NextResponse.json(newReview[0], { status: 201 })
  } catch (error) {
    console.error('Error creating weekly review:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update a weekly review
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
    const { 
      id,
      topicsPlanned,
      weakAreas,
      achievements,
      adjustments,
      reflection
    } = body

    if (!id) {
      return NextResponse.json({ error: 'Review ID is required' }, { status: 400 })
    }

    const updatedReview = await db
      .update(weeklyReviews)
      .set({
        topicsPlanned,
        weakAreas,
        achievements,
        adjustments,
        reflection,
      })
      .where(and(eq(weeklyReviews.id, id), eq(weeklyReviews.userId, user.id)))
      .returning()

    if (updatedReview.length === 0) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    return NextResponse.json(updatedReview[0])
  } catch (error) {
    console.error('Error updating weekly review:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
