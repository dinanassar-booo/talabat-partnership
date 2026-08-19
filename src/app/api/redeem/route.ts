import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/db'

const BRAZE_API_URL = process.env.BRAZE_API_URL || 'https://rest.iad-01.braze.com'
const BRAZE_API_KEY = process.env.BRAZE_API_KEY || ''
const VOUCHER_CANVAS_ID = '91e0ba33-7878-45a9-aa62-bcc9b1437a44'

export async function POST(req: NextRequest) {
  try {
    const { code, talabatEmail } = await req.json()

    if (!code || !talabatEmail) {
      return NextResponse.json({ error: 'Code and talabat email are required' }, { status: 400 })
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(talabatEmail)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    const sql = getDb()

    // Validate code exists and is pending
    const codes = await sql`
      SELECT bc.*, c.credit_value, c.min_order_value, c.validity_days,
             c.discount_type, c.cycle_type, p.company_name, p.country, p.slug
      FROM benefit_codes bc
      JOIN campaigns c ON bc.campaign_id = c.id
      JOIN partners p ON bc.partner_id = p.id
      WHERE bc.code = ${code.trim().toUpperCase()}
      LIMIT 1
    `
    const benefitCode = codes[0]

    if (!benefitCode) {
      return NextResponse.json({ error: 'Invalid code. Please check and try again.' }, { status: 404 })
    }

    if (benefitCode.status === 'redeemed') {
      return NextResponse.json({ error: 'This code has already been redeemed.' }, { status: 409 })
    }

    if (benefitCode.status === 'expired') {
      return NextResponse.json({ error: 'This code has expired.' }, { status: 410 })
    }

    if (new Date(benefitCode.expires_at) < new Date()) {
      await sql`UPDATE benefit_codes SET status = 'expired' WHERE id = ${benefitCode.id}`
      return NextResponse.json({ error: 'This code has expired.' }, { status: 410 })
    }

    // Build campaign reference ID in talabat format
    const countryMap: Record<string, string> = { UAE: 'ae', Kuwait: 'kw', Iraq: 'iq', Bahrain: 'bh', Egypt: 'eg', Qatar: 'qa' }
    const countryCode = countryMap[benefitCode.country] || 'ae'
    const cycleLabel: Record<string, string> = { weekly: 'wkly', biweekly: 'bwkly', monthly: 'mth', quarterly: 'qrt' }
    const cycleKey = cycleLabel[benefitCode.cycle_type] || 'mth'
    const startDate = new Date().toISOString().slice(2, 10).replace(/-/g, '')
    const endDateObj = new Date()
    endDateObj.setDate(endDateObj.getDate() + (Number(benefitCode.validity_days) || 7))
    const endDate = endDateObj.toISOString().slice(2, 10).replace(/-/g, '')
    const safePartner = benefitCode.company_name.replace(/[^a-zA-Z0-9]/g, '')
    const campaignReferenceId = `other_rmo_${countryCode}_PartnerFunded_${safePartner}${benefitCode.credit_value}AED_${startDate}-${endDate}_vw_1x${benefitCode.credit_value}AED_all_${cycleKey}_bth`

    const validTill = new Date()
    validTill.setDate(validTill.getDate() + (Number(benefitCode.validity_days) || 7))
    const validTillUTC = validTill.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, '')

    const titleEn = `AED ${benefitCode.credit_value} voucher from ${benefitCode.company_name}`
    const titleAr = `${benefitCode.credit_value} درهم من ${benefitCode.company_name}`

    // Trigger Braze voucher canvas
    const brazeRes = await fetch(`${BRAZE_API_URL}/canvas/trigger/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BRAZE_API_KEY}`
      },
      body: JSON.stringify({
        canvas_id: VOUCHER_CANVAS_ID,
        recipients: [{ external_user_id: talabatEmail }],
        canvas_entry_properties: {
          discount: Math.round(Number(benefitCode.credit_value) * 100),
          discount_type: benefitCode.discount_type || 'FLAT',
          max_discount: Number(benefitCode.credit_value),
          min_order_value: Number(benefitCode.min_order_value) || 30,
          validity_voucher: validTillUTC,
          country_credit_id: countryCode.toUpperCase(),
          campaign_reference_id: campaignReferenceId,
          title_voucher_en: titleEn,
          title_voucher_ar: titleAr,
          tcs_voucher_en: `AED ${benefitCode.credit_value} voucher from ${benefitCode.company_name} - valid till ${validTill.toISOString().slice(0, 10)}`,
          tcs_voucher_ar: `قسيمة ${benefitCode.credit_value} درهم من ${benefitCode.company_name} - صالحة حتى ${validTill.toISOString().slice(0, 10)}`,
          deeplink_voucher: 'talabat://?c=ae',
          brandGroupid: '',
        },
        broadcast: false,
      })
    })

    const brazeData = await brazeRes.json()
    console.log('Braze voucher trigger:', JSON.stringify(brazeData))

    if (!brazeRes.ok) {
      console.error('Braze error:', brazeData)
      return NextResponse.json({ error: 'Failed to create voucher. Please try again.' }, { status: 500 })
    }

    // Mark code as redeemed
    await sql`
      UPDATE benefit_codes
      SET status = 'redeemed',
          redeemed_at = NOW(),
          claimed_by_email = ${talabatEmail}
      WHERE id = ${benefitCode.id}
    `

    return NextResponse.json({
      ok: true,
      message: 'Your voucher has been created and will appear in your talabat wallet shortly.',
      creditValue: benefitCode.credit_value,
      partnerName: benefitCode.company_name,
    })

  } catch (err) {
    console.error('Redeem error:', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
