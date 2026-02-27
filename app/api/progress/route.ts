import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { dailyProgress, dailyStudyLogs, topics, plans } from '@/lib/db/schema'
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm'

/**
 * OPTIMIZED Progress API
 * 
 * GET: Get progress data for date range
 * POST: Log daily progress/study hours
 * 
 * Performance optimizations:
 * 1. Efficient date range queries
 * 2. Aggregated statistics
 * 3. Batch operations
 */

export const dynamic = 'force-dynamic'

// GET /api/progress - Get progress data
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const { searchParams } = new URL(request.url)
    
    // Default to last 30 days
    const endDate = searchParams.get('endDate') || new Date().toISOString().split('T')[0]
    const startDate = searchParams.get('startDate') || (() => {
      const d = new Date()
      d.setDate(d.getDate() - 30)
      return d.toISOString().split('T')[0]
    })()
    const planId = searchParams.get('planId')

    // Build query conditions
    const conditions = [
      eq(dailyProgress.userId, userId),
      gte(dailyProgress.date, startDate),
      lte(dailyProgress.date, endDate),
    ]

    // Get daily progress entries
    const progress = await db.select({
      id: dailyProgress.id,
      date: dailyProgress.date,
      hoursSpent: dailyProgress.hoursSpent,
      completionPct: dailyProgress.completionPct,
      notes: dailyProgress.notes,
      topicId: dailyProgress.topicId,
      topicTitle: topics.title,
      planId: topics.planId,
    })
    .from(dailyProgress)
    .innerJoin(topics, eq(dailyProgress.topicId, topics.id))
    .where(and(...conditions))
    .orderBy(desc(dailyProgress.date))

    // Filter by planId if provided
    const filtered = planId 
      ? progress.filter(p => p.planId === planId)
      : progress

    // Calculate aggregates
    const totalHours = filtered.reduce((sum, p) => sum + (p.hoursSpent || 0), 0)
    const daysActive = new Set(filtered.map(p => p.date)).size

    // Group by date
    const byDate: Record<string, { hours: number; topics: number; entries: typeof filtered }> = {}
    filtered.forEach(p => {
      if (!byDate[p.date]) {
        byDate[p.date] = { hours: 0, topics: 0, entries: [] }
      }
      byDate[p.date].hours += p.hoursSpent || 0
      byDate[p.date].topics++
      byDate[p.date].entries.push(p)
    })

    return NextResponse.json({
      progress: filtered,
      summary: {
        totalHours: Math.round(totalHours * 10) / 10,
        daysActive,
        avgDailyHours: daysActive > 0 ? Math.round((totalHours / daysActive) * 10) / 10 : 0,
      },
      byDate,
    })
  } catch (error) {
    console.error('Progress GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 })
  }
}

// POST /api/progress - Log daily progress
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const body = await request.json()

    const { topicId, date, hoursSpent, completionPct, notes } = body
    const logDate = date || new Date().toISOString().split('T')[0]

    if (!topicId) {
      return NextResponse.json({ error: 'Topic ID is required' }, { status: 400 })
    }

    // Verify topic exists and user owns the plan
    const topicWithPlan = await db.select({
      topic: topics,
      planUserId: plans.userId,
      planId: plans.id,
    })
    .from(topics)
    .innerJoin(plans, eq(topics.planId, plans.id))
    .where(eq(topics.id, topicId))
    .limit(1)

    if (topicWithPlan.length === 0) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 })
    }

    if (topicWithPlan[0].planUserId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Check for existing log
    const [existingLog] = await db.select()
      .from(dailyProgress)
      .where(and(
        eq(dailyProgress.topicId, topicId),
        eq(dailyProgress.userId, userId),
        eq(dailyProgress.date, logDate)
      ))
      .limit(1)

    let resultLog

    if (existingLog) {
      // Update existing
      const [updated] = await db.update(dailyProgress)
        .set({
          hoursSpent: hoursSpent !== undefined ? hoursSpent : existingLog.hoursSpent,
          completionPct: completionPct !== undefined ? completionPct : existingLog.completionPct,
          notes: notes !== undefined ? notes : existingLog.notes,
        })
        .where(eq(dailyProgress.id, existingLog.id))
        .returning()
      resultLog = updated
    } else {
      // Create new
      const [created] = await db.insert(dailyProgress).values({
        userId,
        topicId,
        date: logDate,
        hoursSpent: hoursSpent || 0,
        completionPct: completionPct || 0,
        notes: notes || null,
      }).returning()
      resultLog = created
    }

    // Also update daily study log for the plan
    await updateDailyStudyLog(userId, topicWithPlan[0].planId, logDate)

    return NextResponse.json({ progress: resultLog })
  } catch (error) {
    console.error('Progress POST error:', error)
    return NextResponse.json({ error: 'Failed to log progress' }, { status: 500 })
  }
}

// Helper to update daily study log aggregate
async function updateDailyStudyLog(userId: string, planId: string, date: string) {
  // Get all progress for this plan and date
  const dayProgress = await db.select({
    hoursSpent: dailyProgress.hoursSpent,
    completionPct: dailyProgress.completionPct,
  })
  .from(dailyProgress)
  .innerJoin(topics, eq(dailyProgress.topicId, topics.id))
  .where(and(
    eq(topics.planId, planId),
    eq(dailyProgress.userId, userId),
    eq(dailyProgress.date, date)
  ))

  const totalHours = dayProgress.reduce((sum, p) => sum + (p.hoursSpent || 0), 0)
  const topicsWorkedOn = dayProgress.length
  const topicsCompleted = dayProgress.filter(p => p.completionPct === 100).length

  // Upsert daily study log
  const [existingStudyLog] = await db.select()
    .from(dailyStudyLogs)
    .where(and(
      eq(dailyStudyLogs.planId, planId),
      eq(dailyStudyLogs.userId, userId),
      eq(dailyStudyLogs.date, date)
    ))
    .limit(1)

  if (existingStudyLog) {
    await db.update(dailyStudyLogs)
      .set({
        actualHours: totalHours,
        topicsCompleted: topicsCompleted,
      })
      .where(eq(dailyStudyLogs.id, existingStudyLog.id))
  } else {
    await db.insert(dailyStudyLogs).values({
      userId,
      planId,
      date,
      plannedHours: 0,
      actualHours: totalHours,
      topicsCompleted: topicsCompleted,
      revisionDone: false,
    })
  }
}
