import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/db'
import { hashEmployeeId, isEmail } from '@/lib/hash'
import { syncEmployeesToBraze } from '@/lib/braze'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { email } = await req.json()
  if (!email || !isEmail(email.trim().toLowerCase())) {
    return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 })
  }

  const normalised = email.trim().toLowerCase()
  const sql = getDb()
  const empIdHash = hashEmployeeId(session.id, normalised)

  const existing = await sql`SELECT id, status FROM employees WHERE partner_id = ${session.id} AND emp_id_hash = ${empIdHash} LIMIT 1`
  if (existing[0] && existing[0].status === 'active') {
    return NextResponse.json({ error: 'This email is already enrolled' }, { status: 409 })
  }

  if (existing[0] && existing[0].status === 'removed') {
    await sql`UPDATE employees SET status = 'active', removed_at = NULL, email = ${normalised} WHERE id = ${existing[0].id}`
  } else {
    const eid = 'emp_' + crypto.randomBytes(8).toString('hex')
    await sql`INSERT INTO employees (id, partner_id, emp_id_hash, email) VALUES (${eid}, ${session.id}, ${empIdHash}, ${normalised})`
  }

  const count = await sql`SELECT COUNT(*) as cnt FROM employees WHERE partner_id = ${session.id} AND status = 'active'`
  const partner = await sql`SELECT company_name FROM partners WHERE id = ${session.id} LIMIT 1`
  syncEmployeesToBraze([normalised], session.id, partner[0]?.company_name || '').catch(console.error)

  return NextResponse.json({ ok: true, totalActive: Number(count[0].cnt) })
}
