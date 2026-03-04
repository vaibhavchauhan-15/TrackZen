import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * Lightweight auth guard — extracts & validates user session.
 *
 * Usage:
 *   const auth = await getAuthUser()
 *   if (auth instanceof NextResponse) return auth   // 401
 *   const { userId } = auth
 *
 * Pattern: Google / Meta internal API middleware
 * - Single function, no class overhead
 * - Returns discriminated union (success | error response)
 * - Zero allocation on the happy path beyond the session object
 */
export async function getAuthUser(): Promise<
    { userId: string } | NextResponse
> {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
        return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 },
        )
    }

    return { userId: session.user.id }
}
