const postgres = require('postgres')
const { readFileSync } = require('fs')
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
    console.log('🔄 Running new study tracking migration...')
    
    // Read only the new migration file
    const migrationSQL = readFileSync(
      join(__dirname, 'drizzle', '0002_add_study_tracking_features.sql'),
      'utf-8'
    )
    
    // Execute the migration
    await client.unsafe(migrationSQL)
    
    console.log('✅ Study tracking features migration completed successfully!')
    await client.end()
    process.exit(0)
  } catch (error) {
    console.error('❌ Migration failed:', error)
    await client.end()
    process.exit(1)
  }
}

migrate()
