import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/db'
import { generateCodeBatch } from '@/lib/codegen'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { campaignId, count } = await req.json()
  if (!campaignId || !count) return NextResponse.json({ error: 'campaignId and count required' }, { status: 400 })
  if (count > 10000) return NextResponse.json({ error: 'Max 10,000 codes per batch' }, { status: 400 })

  const sql = getDb()
  const campaigns = await sql`
    SELECT c.*, bt.slug as benefit_slug, p.country
    FROM campaigns c
    JOIN benefit_types bt ON c.benefit_type_id = bt.id
    JOIN partners p ON c.partner_id = p.id
    WHERE c.id = ${campaignId} AND c.partner_id = ${session.id}
    LIMIT 1
  `
  const campaign = campaigns[0]
  if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + (Number(campaign.validity_days) || 7))

  const countryMap: Record<string, string> = { UAE: 'AE', Kuwait: 'KW', Iraq: 'IQ', Bahrain: 'BH', Egypt: 'EG', Qatar: 'QA' }
  const countryCode = countryMap[campaign.country] || 'AE'

  const codes = generateCodeBatch({
    partnerId: session.id,
    campaignId: campaign.id,
    benefitSlug: campaign.benefit_slug || 'vw',
    creditValue: Number(campaign.credit_value),
    country: countryCode,
    expiresAt: expiresAt.toISOString(),
    count: Number(count),
  })

  const inserted: string[] = []
  for (const code of codes) {
    const id = 'code_' + crypto.randomBytes(8).toString('hex')
    try {
      await sql`INSERT INTO benefit_codes (id, partner_id, campaign_id, code, expires_at) VALUES (${id}, ${session.id}, ${campaignId}, ${code}, ${expiresAt.toISOString()})`
      inserted.push(code)
    } catch { /* skip duplicates */ }
  }

  return NextResponse.json({ ok: true, generated: inserted.length, codes: inserted, expiresAt: expiresAt.toISOString() })
}

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const campaignId = searchParams.get('campaignId')
  if (!campaignId) return NextResponse.json({ error: 'campaignId required' }, { status: 400 })

  const sql = getDb()
  const codes = await sql`
    SELECT id, code, employee_email, status, expires_at, redeemed_at
    FROM benefit_codes
    WHERE campaign_id = ${campaignId} AND partner_id = ${session.id}
    ORDER BY created_at ASC
  `
  const stats = await sql`
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'pending') as pending,
      COUNT(*) FILTER (WHERE status = 'redeemed') as redeemed,
      COUNT(*) FILTER (WHERE status = 'expired') as expired
    FROM benefit_codes
    WHERE campaign_id = ${campaignId} AND partner_id = ${session.id}
  `
  return NextResponse.json({ codes, stats: stats[0] })
}
