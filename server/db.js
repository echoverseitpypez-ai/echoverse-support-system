import postgres from 'postgres'

const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL
// Ensure TLS; pooled connection strings may require SSL
const sql = postgres(connectionString, { ssl: 'require' })

export default sql