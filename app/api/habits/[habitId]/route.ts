import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { habits, habitLogs, streaks } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

/**
 * OPTIMIZED Single Habit API
 * 
 * PATCH: Update habit
 * DELETE: Delete habit
 */

export const dynamic = 'force-dynamic'

interface Params {
  params: Promise<{ habitId: string }>
}

// GET /api/habits/[habitId] - Get single habit
export async function GET(request: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { habitId } = await params
    const userId = session.user.id

    const [habit] = await db.select()
      .from(habits)
      .where(and(eq(habits.id, habitId), eq(habits.userId, userId)))
      .limit(1)

    if (!habit) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 })
    }

    // Get streak info
    const [streak] = await db.select()
      .from(streaks)
      .where(and(
        eq(streaks.userId, userId),
        eq(streaks.type, 'habit'),
        eq(streaks.refId, habitId)
      ))
      .limit(1)

    return NextResponse.json({
      habit: {
        ...habit,
        currentStreak: streak?.currentStreak || 0,
        longestStreak: streak?.longestStreak || 0,
      },
    })
  } catch (error) {
    console.error('Habit GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch habit' }, { status: 500 })
  }
}

// PATCH /api/habits/[habitId] - Update habit
export async function PATCH(request: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { habitId } = await params
    const userId = session.user.id
    const body = await request.json()

    // Prepare update data
    const updateData: Record<string, any> = {}
    
    if (body.title !== undefined) updateData.title = body.title.trim()
    if (body.description !== undefined) updateData.description = body.description?.trim() || null
    if (body.category !== undefined) updateData.category = body.category
    if (body.frequency !== undefined) updateData.frequency = body.frequency
    if (body.targetDays !== undefined) updateData.targetDays = body.targetDays
    if (body.timeSlot !== undefined) updateData.timeSlot = body.timeSlot || null
    if (body.priority !== undefined) updateData.priority = body.priority
    if (body.color !== undefined) updateData.color = body.color
    if (body.icon !== undefined) updateData.icon = body.icon
    if (body.isActive !== undefined) updateData.isActive = body.isActive

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    // Single query: update + ownership check combined (no extra SELECT round-trip)
    const [updatedHabit] = await db.update(habits)
      .set(updateData)
      .where(and(eq(habits.id, habitId), eq(habits.userId, userId)))
      .returning()

    if (!updatedHabit) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 })
    }

    return NextResponse.json({ habit: updatedHabit })
  } catch (error) {
    console.error('Habit PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update habit' }, { status: 500 })
  }
}

// DELETE /api/habits/[habitId] - Delete habit
export async function DELETE(request: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { habitId } = await params
    const userId = session.user.id

    // Verify ownership
    const [existingHabit] = await db.select({ id: habits.id })
      .from(habits)
      .where(and(eq(habits.id, habitId), eq(habits.userId, userId)))
      .limit(1)

    if (!existingHabit) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 })
    }

    // Delete in transaction (habit logs cascade, but delete streak manually)
    await db.transaction(async (tx) => {
      // Delete streak
      await tx.delete(streaks).where(and(
        eq(streaks.userId, userId),
        eq(streaks.type, 'habit'),
        eq(streaks.refId, habitId)
      ))

      // Delete habit (logs cascade due to FK)
      await tx.delete(habits).where(eq(habits.id, habitId))
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Habit DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete habit' }, { status: 500 })
  }
}
