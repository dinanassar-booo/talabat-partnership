import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from './schema'

const globalForDb = globalThis as unknown as { _db: ReturnType<typeof drizzle> | undefined }

function createDb() {
  const url = process.env.DATABASE_URL || 'file:./dev.db'
  const client = createClient({ url })
  return drizzle(client, { schema })
}

export const db = globalForDb._db ?? createDb()
if (process.env.NODE_ENV !== 'production') globalForDb._db = db

export * from './schema'
