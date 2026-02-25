import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { mockTests, users } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'

// GET - Fetch mock tests
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
    const status = searchParams.get('status')

    let conditions = [eq(mockTests.userId, user.id)]
    if (planId) {
      conditions.push(eq(mockTests.planId, planId))
    }
    if (status) {
      conditions.push(eq(mockTests.status, status as 'scheduled' | 'completed' | 'analysed'))
    }

    const tests = await db
      .select()
      .from(mockTests)
      .where(and(...conditions))
      .orderBy(desc(mockTests.testDate))

    return NextResponse.json(tests)
  } catch (error) {
    console.error('Error fetching mock tests:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create a new mock test
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
      testName, 
      testDate, 
      status = 'scheduled',
      totalMarks,
      scoredMarks,
      accuracy,
      timeTaken,
      sections,
      analysisNotes
    } = body

    if (!planId || !testName || !testDate) {
      return NextResponse.json({ error: 'Plan ID, test name, and test date are required' }, { status: 400 })
    }

    const newTest = await db
      .insert(mockTests)
      .values({
        userId: user.id,
        planId,
        testName,
        testDate,
        status,
        totalMarks,
        scoredMarks,
        accuracy,
        timeTaken,
        sections,
        analysisNotes,
      })
      .returning()

    return NextResponse.json(newTest[0], { status: 201 })
  } catch (error) {
    console.error('Error creating mock test:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update a mock test
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
      status,
      totalMarks,
      scoredMarks,
      accuracy,
      timeTaken,
      sections,
      analysisNotes
    } = body

    if (!id) {
      return NextResponse.json({ error: 'Test ID is required' }, { status: 400 })
    }

    const updatedTest = await db
      .update(mockTests)
      .set({
        status,
        totalMarks,
        scoredMarks,
        accuracy,
        timeTaken,
        sections,
        analysisNotes,
      })
      .where(and(eq(mockTests.id, id), eq(mockTests.userId, user.id)))
      .returning()

    if (updatedTest.length === 0) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 })
    }

    return NextResponse.json(updatedTest[0])
  } catch (error) {
    console.error('Error updating mock test:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
