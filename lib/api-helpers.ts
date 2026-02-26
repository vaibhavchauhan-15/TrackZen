/**
 * Shared API helper functions to reduce code duplication
 * and improve performance across all API routes
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

/**
 * Get authenticated user - reduces duplicate code across APIs
 * Returns user object or null if not authenticated
 */
export async function getAuthenticatedUser() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return null
  }

  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.email, session.user.email))
    .limit(1)

  return userResult[0] || null
}

/**
 * Standardized error responses
 */
export const ApiErrors = {
  unauthorized: () => NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
  userNotFound: () => NextResponse.json({ error: 'User not found' }, { status: 404 }),
  notFound: (resource: string) => NextResponse.json({ error: `${resource} not found` }, { status: 404 }),
  badRequest: (message: string) => NextResponse.json({ error: message }, { status: 400 }),
  serverError: (message = 'Internal server error') => NextResponse.json({ error: message }, { status: 500 }),
}

/**
 * Wrapper for authenticated API routes
 * Automatically handles auth and user fetching
 */
export async function withAuth(
  handler: (user: typeof users.$inferSelect) => Promise<NextResponse<any>>
): Promise<NextResponse<any>> {
  try {
    const user = await getAuthenticatedUser()
    
    if (!user) {
      return ApiErrors.unauthorized()
    }

    return await handler(user)
  } catch (error) {
    console.error('API Error:', error)
    
    // In development, return detailed error message
    const isDev = process.env.NODE_ENV === 'development'
    if (isDev && error instanceof Error) {
      return NextResponse.json(
        { 
          error: 'Internal server error', 
          details: error.message,
          stack: error.stack 
        }, 
        { status: 500 }
      )
    }
    
    return ApiErrors.serverError()
  }
}

/**
 * Cache control headers for different scenarios
 */
export const CacheHeaders = {
  // Short cache for frequently changing data
  short: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' },
  // Medium cache for semi-static data
  medium: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=120' },
  // Long cache for static-ish data
  long: { 'Cache-Control': 'private, max-age=300, stale-while-revalidate=600' },
  // No cache for dynamic data
  none: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
}
