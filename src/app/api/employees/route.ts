import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/db'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const sql = getDb()
  const employees = await sql`SELECT id, emp_id_hash, status, enrolled_at FROM employees WHERE partner_id = ${session.id} ORDER BY enrolled_at DESC LIMIT 50`
  const count = await sql`SELECT COUNT(*) as cnt FROM employees WHERE partner_id = ${session.id} AND status = 'active'`
  return NextResponse.json({
    employees: employees.map(e => ({
      id: e.id,
      empIdHash: e.emp_id_hash,
      status: e.status,
      enrolledAt: e.enrolled_at,
    })),
    totalActive: Number(count[0].cnt)
  })
}
