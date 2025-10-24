import fs from 'node:fs'
import path from 'node:path'
import { Client } from 'pg'
import dotenv from 'dotenv'

// Load environment (prefer .env.db.local)
const candidates = ['config/.env.db.local', 'config/.env.local', '.env']
const envPath = candidates.find(p => fs.existsSync(p))
if (envPath) dotenv.config({ path: envPath })

const connString = process.env.SUPABASE_DB_URL
if (!connString) {
  console.error('Missing SUPABASE_DB_URL in config/.env.db.local (or config/.env.local/.env).')
  process.exit(1)
}

const fileArg = process.argv[2] || './db/schema.sql'
const sqlPath = path.resolve(process.cwd(), fileArg)
if (!fs.existsSync(sqlPath)) {
  console.error(`SQL file not found: ${sqlPath}`)
  process.exit(1)
}

const sql = fs.readFileSync(sqlPath, 'utf8')

const client = new Client({ 
  connectionString: connString, 
  ssl: { rejectUnauthorized: false, sslmode: 'require' } 
})
await client.connect()
try {
  await client.query('begin')
  await client.query(sql)
  await client.query('commit')
  console.log(`Applied SQL: ${fileArg}`)
} catch (e) {
  await client.query('rollback')
  console.error('Failed applying SQL:\n', e.message)
  process.exitCode = 1
} finally {
  await client.end()
}
