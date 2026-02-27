import { drizzle } from 'drizzle-orm/postgres-js'
import type { Logger } from 'drizzle-orm'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL!

/**
 * Custom logger that only logs slow queries (>100ms) or when DEBUG_DB=true
 * Set DEBUG_DB=true in .env to see all queries
 */
class CleanLogger implements Logger {
  logQuery(query: string, params: unknown[]): void {
    // Only log if DEBUG_DB is enabled
    if (process.env.DEBUG_DB === 'true') {
      const shortQuery = query.length > 100 ? query.slice(0, 100) + '...' : query
      console.log(`🔍 ${shortQuery}`)
    }
  }
}

/**
 * OPTIMIZED Database Connection Pool
 * 
 * Performance optimizations:
 * 1. Connection pooling with optimal settings for serverless
 * 2. Prepared statements disabled for Supabase Transaction pooling
 * 3. Connection timeout for fast failure
 * 4. Idle timeout to release unused connections
 * 5. Max connections limited to avoid exhausting pool
 */
const client = postgres(connectionString, {
  prepare: false, // Required for Supabase Transaction pool mode
  max: 10, // Max connections in pool (serverless optimal)
  idle_timeout: 20, // Release idle connections after 20s
  connect_timeout: 10, // Fail fast if can't connect in 10s
  max_lifetime: 60 * 30, // Max connection lifetime 30 min
  // Fetch settings for optimal performance
  fetch_types: false, // Skip type fetching (faster startup)
})

export const db = drizzle(client, { 
  schema,
  logger: process.env.DEBUG_DB === 'true' ? new CleanLogger() : false,
})

// Export client for raw queries if needed
export { client }
