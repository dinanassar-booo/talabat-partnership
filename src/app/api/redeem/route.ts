import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/db'

const BRAZE_API_URL = process.env.BRAZE_API_URL || 'https://rest.iad-01.braze.com'
const BRAZE_API_KEY = process.env.BRAZE_API_KEY || ''
const VOUCHER_CANVAS_ID = '74044200-f7c9-4932-aa6e-4f2e7073687f'

const COUNTRY_CODE_MAP: Record<string, string> = {
  UAE: 'AE', Kuwait: 'KW', Iraq: 'IQ', Bahrain: 'BH',
  Egypt: 'EG', Qatar: 'QA', Jordan: 'JO', Oman: 'OM',
}

const CURRENCY_EN: Record<string, string> = {
  AE: 'AED', KW: 'KWD', BH: 'BHD', QA: 'QR',
  EG: 'EGP', IQ: 'IQD', JO: 'JD', OM: 'OMR',
}

const CURRENCY_AR: Record<string, string> = {
  AE: 'درهم', KW: 'د.ك', BH: '.د.ب', QA: 'ر.ق',
  EG: 'ج', IQ: 'د.ع', JO: 'د.ا', OM: 'ر.ع.',
}

const CYCLE_LABEL: Record<string, string> = {
  weekly: 'wkly', biweekly: 'bwkly', monthly: 'mth', quarterly: 'qrt',
}

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

    if (!benefitCode) return NextResponse.json({ error: 'Invalid code. Please check and try again.' }, { status: 404 })
    if (benefitCode.status === 'redeemed') return NextResponse.json({ error: 'This code has already been redeemed.' }, { status: 409 })
    if (benefitCode.status === 'expired') return NextResponse.json({ error: 'This code has expired.' }, { status: 410 })
    if (new Date(benefitCode.expires_at) < new Date()) {
      await sql`UPDATE benefit_codes SET status = 'expired' WHERE id = ${benefitCode.id}`
      return NextResponse.json({ error: 'This code has expired.' }, { status: 410 })
    }

    // Dynamic values
    const countryCode = COUNTRY_CODE_MAP[benefitCode.country] || 'AE'
    const countryCodeLower = countryCode.toLowerCase()
    const currEn = CURRENCY_EN[countryCode] || 'AED'
    const currAr = CURRENCY_AR[countryCode] || 'درهم'
    const creditValue = Number(benefitCode.credit_value)
    const minOrderValue = Number(benefitCode.min_order_value) || 30
    const validityDays = Number(benefitCode.validity_days) || 7
    const discountValue = Math.round(creditValue * 100)
    const cycleKey = CYCLE_LABEL[benefitCode.cycle_type] || 'mth'

    // Dates
    const now = new Date()
    const startDate = now.toISOString().slice(2, 10).replace(/-/g, '')
    const endDateObj = new Date()
    endDateObj.setDate(endDateObj.getDate() + validityDays)
    const endDate = endDateObj.toISOString().slice(2, 10).replace(/-/g, '')

    // Campaign reference ID
    const safePartner = benefitCode.company_name.replace(/[^a-zA-Z0-9]/g, '')
    const campaignReferenceId = `other_rmo_${countryCodeLower}_PartnerFunded_${safePartner}${creditValue}${currEn}_${startDate}-${endDate}_vw_1x${creditValue}${currEn}_all_${cycleKey}_bth`

    // Titles and T&Cs
    const titleEn = `${currEn} ${creditValue} voucher from ${benefitCode.company_name}`
    const titleAr = `${creditValue} ${currAr} من ${benefitCode.company_name}`
    const tcsEn = `${currEn} ${creditValue} voucher from ${benefitCode.company_name}. Min. order ${currEn} ${minOrderValue}. Valid for ${validityDays} days.`
    const tcsAr = `قسيمة ${creditValue} ${currAr} من ${benefitCode.company_name}. الحد الأدنى للطلب ${minOrderValue} ${currAr}. صالحة لمدة ${validityDays} أيام.`

        // Look up user's external_user_id by email
    let externalUserId = talabatEmail // fallback
    try {
      const lookupRes = await fetch(`${BRAZE_API_URL}/users/export/ids`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${BRAZE_API_KEY}`
        },
        body: JSON.stringify({
          email_address: talabatEmail,
          fields_to_export: ['external_id']
        })
      })
      const lookupData = await lookupRes.json()
      console.log('Braze user lookup:', JSON.stringify(lookupData))
      if (lookupData.users?.length > 0 && lookupData.users[0].external_id) {
        externalUserId = lookupData.users[0].external_id
        console.log('Found external_user_id:', externalUserId)
      } else {
        console.log('User not found in Braze, using email as fallback')
      }
    } catch (err) {
      console.error('Braze user lookup failed:', err)
    }

    // Braze payload
    const brazeBody = {
      canvas_id: VOUCHER_CANVAS_ID,
      recipients: [{ external_user_id: externalUserId }],
      canvas_entry_properties: {
        days_expiration: validityDays,
        discountValue: discountValue,
        discountType: benefitCode.discount_type || 'FLAT',
        maxDiscountCap: creditValue,
        minOrderValue: minOrderValue,
        country: countryCode,
        campaignReferenceId: campaignReferenceId,
        talabatSharePercentage: 100,
        allowDuplicates: false,
        title_En: titleEn,
        title_Ar: titleAr,
        termsAndConditions_en: tcsEn,
        termsAndConditions_ar: tcsAr,
        deeplink: `talabat://qcommerce/branches/nearest_darkstore?shopClickOrigin=deeplink&eventOrigin=deeplink`,
        partner_name: benefitCode.company_name,
        benefit_code: benefitCode.code,
      },
      broadcast: false,
    }

    console.log('Braze payload:', JSON.stringify(brazeBody))

    const brazeRes = await fetch(`${BRAZE_API_URL}/canvas/trigger/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BRAZE_API_KEY}`
      },
      body: JSON.stringify(brazeBody)
    })

    const brazeData = await brazeRes.json()
    console.log('Braze response:', JSON.stringify(brazeData))

    if (!brazeRes.ok) {
      console.error('Braze error:', brazeData)
      return NextResponse.json({ error: 'Failed to create voucher. Please try again.' }, { status: 500 })
    }

    // Mark code as redeemed
    await sql`
      UPDATE benefit_codes
      SET status = 'redeemed', redeemed_at = NOW(), claimed_by_email = ${talabatEmail}
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
