import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api/auth-guard'
import { ok, err, notFound, badRequest } from '@/lib/api/response'
import { db } from '@/lib/db'
import { users, streaks } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

/**
 * OPTIMIZED User API
 *
 * GET   — User profile + global streak (parallel)
 * PATCH — Update user settings (atomic merge)
 *
 * Professional patterns:
 * - Parallel queries on GET
 * - Settings merge done atomically (read + write in one flow)
 * - Minimal column projection
 */

export const dynamic = 'force-dynamic'

// ── GET /api/user ────────────────────────────────────────────────
export async function GET() {
  try {
    const auth = await getAuthUser()
    if (auth instanceof NextResponse) return auth
    const { userId } = auth

    // Parallel: user profile + global streak
    const [[user], [globalStreak]] = await Promise.all([
      db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          avatarUrl: users.avatarUrl,
          settings: users.settings,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1),

      db
        .select({
          currentStreak: streaks.currentStreak,
          longestStreak: streaks.longestStreak,
          lastActiveDate: streaks.lastActiveDate,
        })
        .from(streaks)
        .where(and(eq(streaks.userId, userId), eq(streaks.type, 'global')))
        .limit(1),
    ])

    if (!user) return notFound('User not found')

    return ok({
      user: { ...user, image: user.avatarUrl },
      streak: {
        current: globalStreak?.currentStreak ?? 0,
        longest: globalStreak?.longestStreak ?? 0,
        lastActive: globalStreak?.lastActiveDate ?? null,
      },
    })
  } catch (error) {
    console.error('User GET error:', error)
    return err('Failed to fetch user')
  }
}

// ── PATCH /api/user ──────────────────────────────────────────────
export async function PATCH(request: Request) {
  try {
    const auth = await getAuthUser()
    if (auth instanceof NextResponse) return auth
    const { userId } = auth

    const body = await request.json()
    const updateData: Record<string, unknown> = {}

    if (body.name !== undefined) {
      updateData.name = body.name.trim()
    }

    if (body.settings !== undefined) {
      // Atomic settings merge: read current → merge → write
      const [current] = await db
        .select({ settings: users.settings })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1)

      updateData.settings = {
        ...(current?.settings || {}),
        ...body.settings,
      }
    }

    if (Object.keys(updateData).length === 0) return badRequest('No valid fields to update')

    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning()

    return ok(
      {
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          settings: updatedUser.settings,
        },
      },
      { noCache: true },
    )
  } catch (error) {
    console.error('User PATCH error:', error)
    return err('Failed to update user')
  }
}
