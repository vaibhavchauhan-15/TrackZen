import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api/auth-guard'
import { ok, err, badRequest, notFound, forbidden } from '@/lib/api/response'
import { db } from '@/lib/db'
import { dailyProgress, dailyStudyLogs, topics, plans } from '@/lib/db/schema'
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm'

/**
 * OPTIMIZED Progress API
 *
 * GET  — Progress data for a date range (SQL-level filtering)
 * POST — Log daily progress (upsert pattern)
 *
 * Professional patterns:
 * - planId filter pushed to SQL (no JS post-filter)
 * - SQL aggregation for summary stats
 * - Single-pass grouping by date
 * - Upsert helper with minimal queries
 */

export const dynamic = 'force-dynamic'

// ── GET /api/progress ────────────────────────────────────────────
export async function GET(request: Request) {
  try {
    const auth = await getAuthUser()
    if (auth instanceof NextResponse) return auth
    const { userId } = auth

    const { searchParams } = new URL(request.url)
    const endDate = searchParams.get('endDate') || new Date().toISOString().split('T')[0]
    const startDate = searchParams.get('startDate') || (() => {
      const d = new Date()
      d.setDate(d.getDate() - 30)
      return d.toISOString().split('T')[0]
    })()
    const planId = searchParams.get('planId')

    // Build WHERE conditions — push planId filter to SQL
    const conditions = [
      eq(dailyProgress.userId, userId),
      gte(dailyProgress.date, startDate),
      lte(dailyProgress.date, endDate),
    ]
    if (planId) conditions.push(eq(topics.planId, planId))

    // Single query with JOIN — no JS post-filter needed
    const progress = await db
      .select({
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

    // Single-pass aggregation
    let totalHours = 0
    const daysSet = new Set<string>()
    const byDate: Record<string, { hours: number; topics: number; entries: typeof progress }> = {}

    for (const p of progress) {
      const hours = p.hoursSpent || 0
      totalHours += hours
      daysSet.add(p.date)
      const day = (byDate[p.date] ??= { hours: 0, topics: 0, entries: [] })
      day.hours += hours
      day.topics++
      day.entries.push(p)
    }

    const daysActive = daysSet.size

    return ok({
      progress,
      summary: {
        totalHours: Math.round(totalHours * 10) / 10,
        daysActive,
        avgDailyHours: daysActive > 0 ? Math.round((totalHours / daysActive) * 10) / 10 : 0,
      },
      byDate,
    })
  } catch (error) {
    console.error('Progress GET error:', error)
    return err('Failed to fetch progress')
  }
}

// ── POST /api/progress ───────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const auth = await getAuthUser()
    if (auth instanceof NextResponse) return auth
    const { userId } = auth

    const body = await request.json()
    const { topicId, date, hoursSpent, completionPct, notes } = body
    const logDate = date || new Date().toISOString().split('T')[0]

    if (!topicId) return badRequest('Topic ID is required')

    // Verify topic ownership via JOIN — single query
    const [topicRow] = await db
      .select({
        topicId: topics.id,
        planUserId: plans.userId,
        planId: plans.id,
      })
      .from(topics)
      .innerJoin(plans, eq(topics.planId, plans.id))
      .where(eq(topics.id, topicId))
      .limit(1)

    if (!topicRow) return notFound('Topic not found')
    if (topicRow.planUserId !== userId) return forbidden('Unauthorized')

    // Upsert: check existing + create/update
    const [existingLog] = await db
      .select({ id: dailyProgress.id, hoursSpent: dailyProgress.hoursSpent, completionPct: dailyProgress.completionPct, notes: dailyProgress.notes })
      .from(dailyProgress)
      .where(
        and(
          eq(dailyProgress.topicId, topicId),
          eq(dailyProgress.userId, userId),
          eq(dailyProgress.date, logDate),
        ),
      )
      .limit(1)

    let resultLog

    if (existingLog) {
      const [updated] = await db
        .update(dailyProgress)
        .set({
          hoursSpent: hoursSpent !== undefined ? hoursSpent : existingLog.hoursSpent,
          completionPct: completionPct !== undefined ? completionPct : existingLog.completionPct,
          notes: notes !== undefined ? notes : existingLog.notes,
        })
        .where(eq(dailyProgress.id, existingLog.id))
        .returning()
      resultLog = updated
    } else {
      const [created] = await db
        .insert(dailyProgress)
        .values({
          userId,
          topicId,
          date: logDate,
          hoursSpent: hoursSpent || 0,
          completionPct: completionPct || 0,
          notes: notes || null,
        })
        .returning()
      resultLog = created
    }

    // Update aggregate daily study log (fire-and-forget for speed)
    updateDailyStudyLog(userId, topicRow.planId, logDate).catch(e =>
      console.error('Daily study log update failed:', e),
    )

    return ok({ progress: resultLog }, { noCache: true })
  } catch (error) {
    console.error('Progress POST error:', error)
    return err('Failed to log progress')
  }
}

// ── Helper: update daily study log aggregate ─────────────────────
async function updateDailyStudyLog(userId: string, planId: string, date: string) {
  // Get aggregate stats for this plan+date in single query
  const [stats] = await db
    .select({
      totalHours: sql<number>`COALESCE(SUM(${dailyProgress.hoursSpent}), 0)`.as('totalHours'),
      topicsWorked: sql<number>`COUNT(*)`.as('topicsWorked'),
      topicsCompleted: sql<number>`SUM(CASE WHEN ${dailyProgress.completionPct} = 100 THEN 1 ELSE 0 END)`.as('topicsCompleted'),
    })
    .from(dailyProgress)
    .innerJoin(topics, eq(dailyProgress.topicId, topics.id))
    .where(
      and(
        eq(topics.planId, planId),
        eq(dailyProgress.userId, userId),
        eq(dailyProgress.date, date),
      ),
    )

  const totalHours = Number(stats?.totalHours) || 0
  const topicsCompleted = Number(stats?.topicsCompleted) || 0

  // Upsert daily study log
  const [existing] = await db
    .select({ id: dailyStudyLogs.id })
    .from(dailyStudyLogs)
    .where(
      and(
        eq(dailyStudyLogs.planId, planId),
        eq(dailyStudyLogs.userId, userId),
        eq(dailyStudyLogs.date, date),
      ),
    )
    .limit(1)

  if (existing) {
    await db
      .update(dailyStudyLogs)
      .set({ actualHours: totalHours, topicsCompleted })
      .where(eq(dailyStudyLogs.id, existing.id))
  } else {
    await db.insert(dailyStudyLogs).values({
      userId,
      planId,
      date,
      plannedHours: 0,
      actualHours: totalHours,
      topicsCompleted,
      revisionDone: false,
    })
  }
}
