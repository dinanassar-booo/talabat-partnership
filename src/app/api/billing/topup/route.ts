import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/db'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const { amount } = await req.json()
  if (!amount || amount < 1000) return NextResponse.json({ error: 'Minimum top-up is AED 1,000' }, { status: 400 })
  const sql = getDb()
  await sql`UPDATE budget_accounts SET balance = balance + ${amount}, total_top_up = total_top_up + ${amount}, updated_at = NOW() WHERE partner_id = ${session.id}`
  const rows = await sql`SELECT * FROM budget_accounts WHERE partner_id = ${session.id} LIMIT 1`
  return NextResponse.json({ ok: true, account: rows[0] })
}
