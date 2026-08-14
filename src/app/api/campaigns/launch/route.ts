import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/db'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { campaignId } = await req.json()
  if (!campaignId) return NextResponse.json({ error: 'Campaign ID required' }, { status: 400 })

  const sql = getDb()

  const campaigns = await sql`
    SELECT c.*, bt.slug as benefit_slug, p.company_name, p.country
    FROM campaigns c
    JOIN benefit_types bt ON c.benefit_type_id = bt.id
    JOIN partners p ON c.partner_id = p.id
    WHERE c.id = ${campaignId} AND c.partner_id = ${session.id}
    LIMIT 1
  `
  const campaign = campaigns[0]
  if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
  if (campaign.status === 'active') return NextResponse.json({ error: 'Campaign already active' }, { status: 400 })

  const budget = await sql`SELECT balance FROM budget_accounts WHERE partner_id = ${session.id} LIMIT 1`
  if (!budget[0] || Number(budget[0].balance) < Number(campaign.budget_total)) {
    return NextResponse.json({ error: 'Insufficient budget balance' }, { status: 400 })
  }

  const nextSend = new Date()
  const cycleDays: Record<string, number> = { weekly: 7, biweekly: 14, monthly: 30, quarterly: 90 }
  nextSend.setDate(nextSend.getDate() + (cycleDays[campaign.cycle_type] || 30))

  await sql`
    UPDATE campaigns
    SET status = 'active', starts_at = NOW(), next_send_at = ${nextSend.toISOString()}, updated_at = NOW()
    WHERE id = ${campaignId}
  `
  await sql`
    UPDATE budget_accounts
    SET balance = balance - ${campaign.budget_total},
        total_spent = total_spent + ${campaign.budget_total},
        updated_at = NOW()
    WHERE partner_id = ${session.id}
  `

  return NextResponse.json({ ok: true, message: 'Campaign activated. Generate codes from the Codes tab.' })
}
