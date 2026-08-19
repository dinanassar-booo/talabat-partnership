import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/db'
import crypto from 'crypto'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const sql = getDb()
  const campaigns = await sql`SELECT c.*, bt.name as benefit_name, bt.slug as benefit_slug FROM campaigns c JOIN benefit_types bt ON c.benefit_type_id = bt.id WHERE c.partner_id = ${session.id} ORDER BY c.created_at DESC`
  return NextResponse.json({ campaigns })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    const { benefitTypeId, name, creditValue, cycleType, headcount, budgetTotal, minOrderValue, validityDays, startDate, endDate } = await req.json()
  if (!benefitTypeId || !name || !creditValue || !headcount || !budgetTotal) return NextResponse.json({ error: 'All fields required' }, { status: 400 })
  const sql = getDb()
  const benefit = await sql`SELECT id, braze_canvas_id FROM benefit_types WHERE id = ${benefitTypeId} LIMIT 1`
  if (!benefit[0]) return NextResponse.json({ error: 'Invalid benefit type' }, { status: 400 })
  const id = 'camp_' + crypto.randomBytes(8).toString('hex')
  await sql`
    INSERT INTO campaigns (id, partner_id, benefit_type_id, name, credit_value, cycle_type, headcount, budget_total, braze_canvas_id, min_order_value, validity_days, starts_at)
    VALUES (
      ${id}, ${session.id}, ${benefitTypeId}, ${name},
      ${parseFloat(creditValue)}, ${cycleType}, ${parseInt(headcount)}, ${parseFloat(budgetTotal)},
      ${benefit[0].braze_canvas_id || null},
      ${parseFloat(minOrderValue) || 30},
      ${parseInt(validityDays) || 7},
      ${startDate ? new Date(startDate).toISOString() : new Date().toISOString()}
    )
  `
  return NextResponse.json({ ok: true, id }, { status: 201 })
}
