import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/db'

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const sql = getDb()
  await sql`DELETE FROM benefit_codes WHERE campaign_id = ${params.id} AND partner_id = ${session.id}`
  await sql`DELETE FROM campaigns WHERE id = ${params.id} AND partner_id = ${session.id}`
  return NextResponse.json({ ok: true })
}
