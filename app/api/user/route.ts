import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { users, streaks } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

/**
 * OPTIMIZED User API
 * 
 * GET: Get user profile with global streak
 * PATCH: Update user settings
 */

export const dynamic = 'force-dynamic'

// GET /api/user - Get user profile
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Parallel queries
    const [[user], [globalStreak]] = await Promise.all([
      db.select({
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

      db.select()
        .from(streaks)
        .where(and(
          eq(streaks.userId, userId),
          eq(streaks.type, 'global')
        ))
        .limit(1),
    ])

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      user: {
        ...user,
        image: user.avatarUrl,
      },
      streak: {
        current: globalStreak?.currentStreak || 0,
        longest: globalStreak?.longestStreak || 0,
        lastActive: globalStreak?.lastActiveDate || null,
      },
    })
  } catch (error) {
    console.error('User GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
  }
}

// PATCH /api/user - Update user settings
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const body = await request.json()

    const updateData: Record<string, any> = {}
    
    if (body.name !== undefined) {
      updateData.name = body.name.trim()
    }
    
    if (body.settings !== undefined) {
      // Get current settings and merge
      const [currentUser] = await db.select({ settings: users.settings })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1)

      updateData.settings = {
        ...(currentUser?.settings || {}),
        ...body.settings,
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const [updatedUser] = await db.update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning()

    return NextResponse.json({
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        settings: updatedUser.settings,
      },
    })
  } catch (error) {
    console.error('User PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}
