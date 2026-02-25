const postgres = require('postgres')
const { readFileSync, readdirSync } = require('fs')
const { join } = require('path')

// Load env vars manually for Node.js
require('fs').readFileSync('.env', 'utf-8').split('\n').forEach(line => {
  const [key, ...values] = line.split('=')
  if (key && values.length) {
    process.env[key] = values.join('=').trim()
  }
})

async function migrate() {
  const client = postgres(process.env.DATABASE_URL, { prepare: false })
  
  try {
    console.log('🔄 Running database migrations...')
    
    // Get all SQL migration files
    const migrationsDir = join(__dirname, 'drizzle')
    const migrationFiles = readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort() // Sort to ensure migrations run in order
    
    for (const file of migrationFiles) {
      console.log(`  📝 Running migration: ${file}`)
      const migrationSQL = readFileSync(join(migrationsDir, file), 'utf-8')
      await client.unsafe(migrationSQL)
      console.log(`  ✅ Completed: ${file}`)
    }
    
    console.log('✅ All database migrations completed successfully!')
    await client.end()
    process.exit(0)
  } catch (error) {
    console.error('❌ Migration failed:', error)
    await client.end()
    process.exit(1)
  }
}

migrate()
