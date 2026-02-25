import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { mistakeNotebook, users } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'

// GET - Fetch mistakes
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
    const mockTestId = searchParams.get('mockTestId')
    const category = searchParams.get('category')
    const unresolvedOnly = searchParams.get('unresolvedOnly') === 'true'

    let conditions = [eq(mistakeNotebook.userId, user.id)]
    if (topicId) {
      conditions.push(eq(mistakeNotebook.topicId, topicId))
    }
    if (mockTestId) {
      conditions.push(eq(mistakeNotebook.mockTestId, mockTestId))
    }
    if (category) {
      conditions.push(eq(mistakeNotebook.category, category))
    }
    if (unresolvedOnly) {
      conditions.push(eq(mistakeNotebook.isResolved, false))
    }

    const mistakes = await db
      .select()
      .from(mistakeNotebook)
      .where(and(...conditions))
      .orderBy(desc(mistakeNotebook.createdAt))

    return NextResponse.json(mistakes)
  } catch (error) {
    console.error('Error fetching mistakes:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Add a new mistake
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
      topicId,
      mockTestId,
      question,
      yourAnswer,
      correctAnswer,
      explanation,
      category
    } = body

    if (!question || !correctAnswer) {
      return NextResponse.json({ error: 'Question and correct answer are required' }, { status: 400 })
    }

    const newMistake = await db
      .insert(mistakeNotebook)
      .values({
        userId: user.id,
        topicId,
        mockTestId,
        question,
        yourAnswer,
        correctAnswer,
        explanation,
        category,
      })
      .returning()

    return NextResponse.json(newMistake[0], { status: 201 })
  } catch (error) {
    console.error('Error creating mistake:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update a mistake (mark as resolved, add review)
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
    const { id, isResolved, incrementReview } = body

    if (!id) {
      return NextResponse.json({ error: 'Mistake ID is required' }, { status: 400 })
    }

    // Get current mistake
    const currentMistake = await db
      .select()
      .from(mistakeNotebook)
      .where(and(eq(mistakeNotebook.id, id), eq(mistakeNotebook.userId, user.id)))
      .limit(1)

    if (currentMistake.length === 0) {
      return NextResponse.json({ error: 'Mistake not found' }, { status: 404 })
    }

    const updateData: any = {}
    
    if (typeof isResolved === 'boolean') {
      updateData.isResolved = isResolved
    }
    
    if (incrementReview) {
      updateData.reviewCount = currentMistake[0].reviewCount + 1
      updateData.lastReviewDate = new Date().toISOString().split('T')[0]
    }

    const updatedMistake = await db
      .update(mistakeNotebook)
      .set(updateData)
      .where(and(eq(mistakeNotebook.id, id), eq(mistakeNotebook.userId, user.id)))
      .returning()

    return NextResponse.json(updatedMistake[0])
  } catch (error) {
    console.error('Error updating mistake:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Remove a mistake
export async function DELETE(req: NextRequest) {
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
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Mistake ID is required' }, { status: 400 })
    }

    await db
      .delete(mistakeNotebook)
      .where(and(eq(mistakeNotebook.id, id), eq(mistakeNotebook.userId, user.id)))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting mistake:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
