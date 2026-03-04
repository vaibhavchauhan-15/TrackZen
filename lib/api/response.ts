import { NextResponse } from 'next/server'

/**
 * Standardised API response helpers.
 *
 * Every response carries a consistent Cache-Control header so the
 * browser + CDN behave predictably.
 *
 * Pattern: Microsoft / Meta API gateway conventions
 * - Success responses default to short private cache
 * - Error responses are never cached
 * - `noCache` flag available for mutation acknowledgements
 */

const NO_CACHE = 'no-store, must-revalidate' as const
const PRIVATE_SHORT = 'private, max-age=60, stale-while-revalidate=30' as const

/** Return a success JSON response with optional caching. */
export function ok<T>(data: T, opts?: { status?: number; noCache?: boolean }) {
    return NextResponse.json(data, {
        status: opts?.status ?? 200,
        headers: {
            'Cache-Control': opts?.noCache ? NO_CACHE : PRIVATE_SHORT,
        },
    })
}

/** Return an error JSON response (never cached). */
export function err(message: string, status: number = 500) {
    return NextResponse.json(
        { error: message },
        { status, headers: { 'Cache-Control': NO_CACHE } },
    )
}

/** Shorthand for 400 Bad Request. */
export function badRequest(message: string) {
    return err(message, 400)
}

/** Shorthand for 404 Not Found. */
export function notFound(message: string) {
    return err(message, 404)
}

/** Shorthand for 403 Forbidden. */
export function forbidden(message: string) {
    return err(message, 403)
}
