import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { revisionTracking, users, topics } from '@/lib/db/schema'
import { eq, and, gte, lte, sql } from 'drizzle-orm'

// GET - Fetch revision tracking
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
    const topicId = searchParams.get('topicId')
    const stage = searchParams.get('stage')
    const dueOnly = searchParams.get('dueOnly') === 'true'

    let conditions = [eq(revisionTracking.userId, user.id)]
    if (topicId) {
      conditions.push(eq(revisionTracking.topicId, topicId))
    }
    if (stage) {
      conditions.push(eq(revisionTracking.stage, stage as 'first' | 'second' | 'third'))
    }
    if (dueOnly) {
      const today = new Date().toISOString().split('T')[0]
      conditions.push(lte(revisionTracking.scheduledDate, today))
      conditions.push(sql`${revisionTracking.completedDate} IS NULL`)
    }

    const revisions = await db
      .select({
        revision: revisionTracking,
        topic: topics,
      })
      .from(revisionTracking)
      .leftJoin(topics, eq(revisionTracking.topicId, topics.id))
      .where(and(...conditions))
      .orderBy(revisionTracking.scheduledDate)

    return NextResponse.json(revisions)
  } catch (error) {
    console.error('Error fetching revision tracking:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create revision tracking entries
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
    const { topicId, completedDate } = body

    if (!topicId || !completedDate) {
      return NextResponse.json({ error: 'Topic ID and completed date are required' }, { status: 400 })
    }

    // Calculate revision dates based on 24h, 7d, 30d formula
    const completed = new Date(completedDate)
    
    const firstRevision = new Date(completed)
    firstRevision.setDate(firstRevision.getDate() + 1) // 24 hours
    
    const secondRevision = new Date(completed)
    secondRevision.setDate(secondRevision.getDate() + 7) // 7 days
    
    const thirdRevision = new Date(completed)
    thirdRevision.setDate(thirdRevision.getDate() + 30) // 30 days

    // Create all three revision entries
    const revisions = await db
      .insert(revisionTracking)
      .values([
        {
          userId: user.id,
          topicId,
          stage: 'first',
          scheduledDate: firstRevision.toISOString().split('T')[0],
        },
        {
          userId: user.id,
          topicId,
          stage: 'second',
          scheduledDate: secondRevision.toISOString().split('T')[0],
        },
        {
          userId: user.id,
          topicId,
          stage: 'third',
          scheduledDate: thirdRevision.toISOString().split('T')[0],
        },
      ])
      .returning()

    return NextResponse.json(revisions, { status: 201 })
  } catch (error) {
    console.error('Error creating revision tracking:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Mark revision as complete
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
    const { id, completedDate, confidenceLevel, notes } = body

    if (!id) {
      return NextResponse.json({ error: 'Revision ID is required' }, { status: 400 })
    }

    const updatedRevision = await db
      .update(revisionTracking)
      .set({
        completedDate: completedDate || new Date().toISOString().split('T')[0],
        confidenceLevel,
        notes,
      })
      .where(and(eq(revisionTracking.id, id), eq(revisionTracking.userId, user.id)))
      .returning()

    if (updatedRevision.length === 0) {
      return NextResponse.json({ error: 'Revision not found' }, { status: 404 })
    }

    return NextResponse.json(updatedRevision[0])
  } catch (error) {
    console.error('Error updating revision tracking:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
