import { neon } from '@neondatabase/serverless'

export function getDb() {
  const url = process.env.POSTGRES_URL || process.env.DATABASE_URL
  if (!url) throw new Error('No database URL configured')
  return neon(url)
}
