import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { streaks, users } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { calculateGlobalStreak } from '@/lib/streak'
import { withAuth, CacheHeaders } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  return withAuth(async (user) => {
    // Get or calculate global streak
    const globalStreak = await calculateGlobalStreak(user.id)

    // Get all streaks
    const userStreaks = await db
      .select()
      .from(streaks)
      .where(eq(streaks.userId, user.id))

    return NextResponse.json(
      { globalStreak, streaks: userStreaks },
      { headers: CacheHeaders.short }
    )
  })
}
