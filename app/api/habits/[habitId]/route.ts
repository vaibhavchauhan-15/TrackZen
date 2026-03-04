import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api/auth-guard'
import { ok, err, notFound, badRequest } from '@/lib/api/response'
import { db } from '@/lib/db'
import { habits, streaks } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

/**
 * OPTIMIZED Single Habit API
 *
 * GET    — Fetch habit + streak (parallel queries)
 * PATCH  — Update habit (single query, ownership via WHERE)
 * DELETE — Remove habit + streak (single transaction)
 *
 * Professional patterns:
 * - Parallel queries on GET (habit + streak at once)
 * - PATCH uses UPDATE...WHERE owner = userId → no extra SELECT
 * - DELETE uses transaction for atomicity
 * - Removed unused `habitLogs` import
 */

export const dynamic = 'force-dynamic'

interface Params {
  params: Promise<{ habitId: string }>
}

// ── GET /api/habits/[habitId] ────────────────────────────────────
export async function GET(_request: Request, { params }: Params) {
  try {
    const auth = await getAuthUser()
    if (auth instanceof NextResponse) return auth
    const { userId } = auth
    const { habitId } = await params

    // Parallel: habit + streak
    const [[habit], [streak]] = await Promise.all([
      db
        .select()
        .from(habits)
        .where(and(eq(habits.id, habitId), eq(habits.userId, userId)))
        .limit(1),

      db
        .select({
          currentStreak: streaks.currentStreak,
          longestStreak: streaks.longestStreak,
        })
        .from(streaks)
        .where(
          and(
            eq(streaks.userId, userId),
            eq(streaks.type, 'habit'),
            eq(streaks.refId, habitId),
          ),
        )
        .limit(1),
    ])

    if (!habit) return notFound('Habit not found')

    return ok({
      habit: {
        ...habit,
        currentStreak: streak?.currentStreak ?? 0,
        longestStreak: streak?.longestStreak ?? 0,
      },
    })
  } catch (error) {
    console.error('Habit GET error:', error)
    return err('Failed to fetch habit')
  }
}

// ── PATCH /api/habits/[habitId] ──────────────────────────────────
export async function PATCH(request: Request, { params }: Params) {
  try {
    const auth = await getAuthUser()
    if (auth instanceof NextResponse) return auth
    const { userId } = auth
    const { habitId } = await params
    const body = await request.json()

    // Build patch object — only include provided fields
    const allowedFields = [
      'title', 'description', 'category', 'frequency',
      'targetDays', 'timeSlot', 'priority', 'color', 'icon', 'isActive',
    ] as const

    const updateData: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] =
          field === 'title' ? body[field].trim()
            : field === 'description' ? (body[field]?.trim() || null)
              : field === 'timeSlot' ? (body[field] || null)
                : body[field]
      }
    }

    if (Object.keys(updateData).length === 0) {
      return badRequest('No valid fields to update')
    }

    // Single query: UPDATE + ownership check in WHERE — no extra SELECT
    const [updatedHabit] = await db
      .update(habits)
      .set(updateData)
      .where(and(eq(habits.id, habitId), eq(habits.userId, userId)))
      .returning()

    if (!updatedHabit) return notFound('Habit not found')

    return ok({ habit: updatedHabit }, { noCache: true })
  } catch (error) {
    console.error('Habit PATCH error:', error)
    return err('Failed to update habit')
  }
}

// ── DELETE /api/habits/[habitId] ─────────────────────────────────
export async function DELETE(_request: Request, { params }: Params) {
  try {
    const auth = await getAuthUser()
    if (auth instanceof NextResponse) return auth
    const { userId } = auth
    const { habitId } = await params

    // Verify ownership with minimal projection
    const [existing] = await db
      .select({ id: habits.id })
      .from(habits)
      .where(and(eq(habits.id, habitId), eq(habits.userId, userId)))
      .limit(1)

    if (!existing) return notFound('Habit not found')

    // Atomic delete: streak + habit in single transaction
    await db.transaction(async tx => {
      await tx
        .delete(streaks)
        .where(
          and(
            eq(streaks.userId, userId),
            eq(streaks.type, 'habit'),
            eq(streaks.refId, habitId),
          ),
        )
      await tx.delete(habits).where(eq(habits.id, habitId))
    })

    return ok({ success: true }, { noCache: true })
  } catch (error) {
    console.error('Habit DELETE error:', error)
    return err('Failed to delete habit')
  }
}
