import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/db'
import crypto from 'crypto'

const BRAZE_API_URL = process.env.BRAZE_API_URL || 'https://rest.iad-01.braze.com'
const BRAZE_API_KEY = process.env.BRAZE_API_KEY || ''

// PLACEHOLDER: Replace with real Braze email canvas ID for verification email
const VERIFICATION_EMAIL_CANVAS_ID = '74044200-f7c9-4932-aa6e-4f2e7073687f'

// PLACEHOLDER: Replace with real IAM deeplink format
const IAM_DEEPLINK = 'talabat://iam/benefit-claim'

function hashEmployeeId(partnerId: string, employeeId: string): string {
  return crypto.createHmac('sha256', partnerId).update(employeeId.trim().toLowerCase()).digest('hex')
}

export async function POST(req: NextRequest) {
  try {
    const { slug, employeeId, companyEmail } = await req.json()

    if (!slug || !employeeId || !companyEmail) {
      return NextResponse.json({ error: 'All fields required' }, { status: 400 })
    }

    // Validate email format
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

    // Check if this employee already claimed a code
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

    // Find an available code from any active campaign for this partner
    const availableCodes = await sql`
      SELECT bc.*, c.name as campaign_name, c.credit_value, c.validity_days
      FROM benefit_codes bc
      JOIN campaigns c ON bc.campaign_id = c.id
      WHERE bc.partner_id = ${partner.id}
      AND bc.status = 'pending'
      AND c.status = 'active'
      ORDER BY bc.created_at ASC
      LIMIT 1
    `
    if (availableCodes.length === 0) {
      return NextResponse.json({ error: 'No benefit codes available at this time. Please contact your HR team.' }, { status: 404 })
    }

    const code = availableCodes[0]

    // Assign code to this employee
    await sql`
      UPDATE benefit_codes 
      SET 
        status = 'claimed',
        claimed_by_email = ${companyEmail},
        claimed_by_employee_id = ${empIdHash},
        claimed_at = NOW()
      WHERE id = ${code.id}
    `

    // Sync employee to Braze — set partnership attribute
    const brazeSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-')
    await fetch(`${BRAZE_API_URL}/users/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${BRAZE_API_KEY}` },
      body: JSON.stringify({
        attributes: [{
          email: companyEmail,
          partnership_id: brazeSlug,
          partner_name: partner.company_name,
          employee_id_hash: empIdHash,
          benefit_code: code.code,
          _update_existing_only: false,
          user_alias: { alias_name: companyEmail, alias_label: 'email' },
        }]
      })
    }).catch(console.error)

    // PLACEHOLDER: Trigger Braze verification email canvas
    // This sends the employee an email with their code + IAM deeplink
    await fetch(`${BRAZE_API_URL}/canvas/trigger/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${BRAZE_API_KEY}` },
      body: JSON.stringify({
        canvas_id: VERIFICATION_EMAIL_CANVAS_ID,
        recipients: [{ external_user_id: companyEmail }],
        canvas_entry_properties: {
          benefit_code: code.code,
          partner_name: partner.company_name,
          iam_deeplink: IAM_DEEPLINK,
          credit_value: code.credit_value,
          validity_days: code.validity_days,
        }
      })
    }).catch(console.error)

    return NextResponse.json({
      ok: true,
      message: 'Check your email for your benefit code and redemption link.',
    })

  } catch (err) {
    console.error('Join error:', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
