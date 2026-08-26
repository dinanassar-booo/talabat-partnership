import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/db'
import crypto from 'crypto'

const BRAZE_API_URL = process.env.BRAZE_API_URL || 'https://rest.iad-01.braze.com'
const BRAZE_API_KEY = process.env.BRAZE_API_KEY || ''
const EMAIL_CANVAS_ID = '74044200-f7c9-4932-aa6e-4f2e7073687f'

function hashEmployeeId(partnerId: string, employeeId: string): string {
  return crypto.createHmac('sha256', partnerId).update(employeeId.trim().toLowerCase()).digest('hex')
}

export async function POST(req: NextRequest) {
  try {
    const { slug, employeeId, companyEmail } = await req.json()

    if (!slug || !employeeId || !companyEmail) {
      return NextResponse.json({ error: 'All fields required' }, { status: 400 })
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(companyEmail)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    const sql = getDb()

    // Find partner by slug
    const partners = await sql`SELECT * FROM partners WHERE slug = ${slug} LIMIT 1`
    const partner = partners[0]
    if (!partner) return NextResponse.json({ error: 'Company not found' }, { status: 404 })

    // Validate company email domain if set
    if (partner.company_email_domain) {
      const domain = companyEmail.split('@')[1]?.toLowerCase()
      if (domain !== partner.company_email_domain.toLowerCase()) {
        return NextResponse.json({ error: `Please use your ${partner.company_email_domain} email address` }, { status: 400 })
      }
    }

    // Check if already claimed
    const empIdHash = hashEmployeeId(partner.id, employeeId)
    const alreadyClaimed = await sql`
      SELECT id FROM benefit_codes
      WHERE partner_id = ${partner.id}
      AND claimed_by_employee_id = ${empIdHash}
      AND status = 'claimed'
      LIMIT 1
    `
    if (alreadyClaimed.length > 0) {
      return NextResponse.json({ error: 'You have already claimed a benefit code' }, { status: 409 })
    }

    // Find available code from active campaign
    const availableCodes = await sql`
      SELECT bc.*, c.name as campaign_name, c.credit_value, c.validity_days,
             c.min_order_value, c.discount_type, c.cycle_type
      FROM benefit_codes bc
      JOIN campaigns c ON bc.campaign_id = c.id
      WHERE bc.partner_id = ${partner.id}
      AND bc.status = 'pending'
      AND c.status = 'active'
      ORDER BY bc.created_at ASC
      LIMIT 1
    `
    if (availableCodes.length === 0) {
      return NextResponse.json({ error: 'No benefit codes available. Please contact your HR team.' }, { status: 404 })
    }

    const code = availableCodes[0]

    // Assign code to this employee
    await sql`
      UPDATE benefit_codes
      SET status = 'claimed',
          claimed_by_email = ${companyEmail},
          claimed_by_employee_id = ${empIdHash},
          claimed_at = NOW()
      WHERE id = ${code.id}
    `

    // Build dynamic values for email
    const countryCodeMap: Record<string, string> = { UAE: 'AE', Kuwait: 'KW', Iraq: 'IQ', Bahrain: 'BH', Egypt: 'EG', Qatar: 'QA', Jordan: 'JO', Oman: 'OM' }
    const currencyMap: Record<string, string> = { AE: 'AED', KW: 'KWD', BH: 'BHD', QA: 'QR', EG: 'EGP', IQ: 'IQD', JO: 'JD', OM: 'OMR' }
    const countryCode = countryCodeMap[partner.country] || 'AE'
    const currency = currencyMap[countryCode] || 'AED'
    const creditValue = Number(code.credit_value)
    const validityDays = Number(code.validity_days) || 7
    const minOrderValue = Number(code.min_order_value) || 30
    const redeemUrl = `https://talabat-partnership.vercel.app/redeem?code=${encodeURIComponent(code.code)}`

    // Trigger Braze canvas — sends email with code + redeem link
    const brazeRes = await fetch(`${BRAZE_API_URL}/canvas/trigger/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BRAZE_API_KEY}`
      },
      body: JSON.stringify({
        canvas_id: EMAIL_CANVAS_ID,
        recipients: [{ external_user_id: '27608673' }],
        canvas_entry_properties: {
          benefit_code: code.code,
          partner_name: partner.company_name,
          title_En: `${currency} ${creditValue} voucher from ${partner.company_name}`,
          title_Ar: `${creditValue} من ${partner.company_name}`,
          days_expiration: validityDays,
          minOrderValue: minOrderValue,
          credit_value: creditValue,
          currency: currency,
          country: countryCode,
          redeem_url: redeemUrl,
          deeplink_voucher: `talabat://?c=${countryCode.toLowerCase()}`,
        }
      })
    })

    const brazeData = await brazeRes.json()
    console.log('Braze email trigger:', JSON.stringify(brazeData))

    return NextResponse.json({
      ok: true,
      message: 'Check your email for your benefit code and redemption link.',
    })

  } catch (err) {
    console.error('Join error:', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
