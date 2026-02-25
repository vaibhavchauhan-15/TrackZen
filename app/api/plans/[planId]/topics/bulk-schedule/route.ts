import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { topics as topicsTable, plans, users } from '@/lib/db/schema'
import { eq, and, inArray } from 'drizzle-orm'

export async function POST(
  req: NextRequest,
  { params }: { params: { planId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db.select().from(users).where(eq(users.email, session.user.email)).limit(1)
    if (!user.length) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify plan belongs to user
    const [plan] = await db
      .select()
      .from(plans)
      .where(and(eq(plans.id, params.planId), eq(plans.userId, user[0].id)))
      .limit(1)

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    const body = await req.json()
    const { schedules } = body // Array of { topicId: string, scheduledDate: string }

    if (!Array.isArray(schedules) || schedules.length === 0) {
      return NextResponse.json({ error: 'Invalid schedules data' }, { status: 400 })
    }

    // Use a transaction for bulk updates
    const updates = await Promise.all(
      schedules.map(({ topicId, scheduledDate }) =>
        db
          .update(topicsTable)
          .set({ scheduledDate })
          .where(
            and(
              eq(topicsTable.id, topicId),
              eq(topicsTable.planId, params.planId)
            )
          )
          .returning()
      )
    )

    return NextResponse.json({ 
      success: true, 
      updated: updates.filter(u => u.length > 0).length 
    })
  } catch (error) {
    console.error('Error bulk updating topics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
