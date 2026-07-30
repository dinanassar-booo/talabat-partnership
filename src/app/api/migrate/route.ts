import { NextRequest, NextResponse } from 'next/server'
import { ensureDb } from '@/db/ensure-db'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const secret = body?.secret
  if (process.env.MIGRATE_SECRET && secret !== process.env.MIGRATE_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  try {
    await ensureDb()
    return NextResponse.json({ ok: true, message: 'Database tables created/verified' })
  } catch (err) {
    console.error('Migration error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
