import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { streaks, users } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { calculateGlobalStreak } from '@/lib/streak'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db.select().from(users).where(eq(users.email, session.user.email)).limit(1)
    if (!user.length) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get or calculate global streak
    const globalStreak = await calculateGlobalStreak(user[0].id)

    // Get all streaks
    const userStreaks = await db
      .select()
      .from(streaks)
      .where(eq(streaks.userId, user[0].id))

    return NextResponse.json({
      globalStreak,
      streaks: userStreaks,
    })
  } catch (error) {
    console.error('Error fetching streaks:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
