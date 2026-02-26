import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { topics as topicsTable, plans, users } from '@/lib/db/schema'
import { eq, and, inArray, sql } from 'drizzle-orm'
import { withAuth, ApiErrors } from '@/lib/api-helpers'

export async function POST(
  req: NextRequest,
  { params }: { params: { planId: string } }
) {
  return withAuth(async (user) => {
    // Verify plan belongs to user
    const [plan] = await db
      .select()
      .from(plans)
      .where(and(eq(plans.id, params.planId), eq(plans.userId, user.id)))
      .limit(1)

    if (!plan) {
      return ApiErrors.notFound('Plan')
    }

    const body = await req.json()
    const { schedules } = body // Array of { topicId: string, scheduledDate: string }

    if (!Array.isArray(schedules) || schedules.length === 0) {
      return ApiErrors.badRequest('Invalid schedules data')
    }

    // OPTIMIZATION: Batch updates in a transaction with parallel execution
    // Combines atomicity with speed - all updates happen in one transaction
    await db.transaction(async (tx) => {
      await Promise.all(
        schedules.map(({ topicId, scheduledDate }) =>
          tx
            .update(topicsTable)
            .set({ scheduledDate })
            .where(
              and(
                eq(topicsTable.id, topicId),
                eq(topicsTable.planId, params.planId)
              )
            )
        )
      )
    })

    return NextResponse.json({ 
      success: true, 
      updated: schedules.length 
    })
  })
}
