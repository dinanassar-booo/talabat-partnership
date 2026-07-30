import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/db'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const sql = getDb()
  const rows = await sql`SELECT * FROM budget_accounts WHERE partner_id = ${session.id} LIMIT 1`
  const row = rows[0]
  if (!row) return NextResponse.json({ account: null })
  return NextResponse.json({
    account: {
      id: row.id,
      balance: Number(row.balance),
      totalTopUp: Number(row.total_top_up),
      totalSpent: Number(row.total_spent),
    }
  })
}
