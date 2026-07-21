import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/db'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const { id } = await params
  const sql = getDb()
  const rows = await sql`SELECT id FROM employees WHERE id = ${id} AND partner_id = ${session.id}`
  if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  await sql`UPDATE employees SET status = 'removed', removed_at = NOW() WHERE id = ${id}`
  return NextResponse.json({ ok: true })
}
