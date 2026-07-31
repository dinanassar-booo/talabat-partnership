const BRAZE_API_URL = process.env.BRAZE_API_URL || 'https://rest.fra-01.braze.eu'
const BRAZE_API_KEY = process.env.BRAZE_API_KEY || ''
const VOUCHER_WALLET_CANVAS_ID = '91e0ba33-7878-45a9-aa62-bcc9b1437a44'

function brazeHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${BRAZE_API_KEY}`,
  }
}

export async function syncEmployeesToBraze(
  emails: string[],
  partnerId: string,
  partnerName: string
): Promise<{ success: number; errors: string[] }> {
  const errors: string[] = []
  let success = 0
  const chunks = chunkArray(emails, 75)
  for (const chunk of chunks) {
    const attributes = chunk.map(email => ({
      email,
      partner_id: partnerId,
      partner_name: partnerName,
      b2b_benefit_active: true,
      _update_existing_only: false,
      user_alias: { alias_name: email, alias_label: 'email' },
    }))
    const res = await fetch(`${BRAZE_API_URL}/users/track`, {
      method: 'POST',
      headers: brazeHeaders(),
      body: JSON.stringify({ attributes }),
    })
    const data = await res.json()
    if (!res.ok) {
      errors.push(`Batch error: ${JSON.stringify(data.errors || data.message)}`)
    } else {
      success += chunk.length
    }
  }
  return { success, errors }
}

export async function removeEmployeesFromBraze(emails: string[]): Promise<void> {
  const chunks = chunkArray(emails, 75)
  for (const chunk of chunks) {
    const attributes = chunk.map(email => ({
      email,
      partner_id: null,
      partner_name: null,
      b2b_benefit_active: false,
    }))
    await fetch(`${BRAZE_API_URL}/users/track`, {
      method: 'POST',
      headers: brazeHeaders(),
      body: JSON.stringify({ attributes }),
    })
  }
}

export async function triggerVoucherWalletCampaign(params: {
  emails: string[]
  campaignId: string
  partnerId: string
  partnerName: string
  creditValue: number
  minOrderValue: number
  discountType: string
  validityDays: number
  country: string
  cycleType: string
}): Promise<{ ok: boolean; error?: string }> {
  const {
    emails, campaignId, partnerId, partnerName,
    creditValue, minOrderValue, discountType, validityDays, country
  } = params

  const validTill = new Date()
  validTill.setDate(validTill.getDate() + validityDays)
  const validTillUTC = validTill.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, '')

  const cycleLabel: Record<string, string> = { weekly: 'wkly', biweekly: 'bwkly', monthly: 'mth', quarterly: 'qrt' }
  const startDate = new Date().toISOString().slice(2, 10).replace(/-/g, '')
  const endDateObj = new Date()
  endDateObj.setDate(endDateObj.getDate() + validityDays)
  const endDate = endDateObj.toISOString().slice(2, 10).replace(/-/g, '')
  const safePartnerName = partnerName.replace(/[^a-zA-Z0-9]/g, '')
  const cycleKey = cycleLabel[params.cycleType] || 'mth'
  const countryMap: Record<string, string> = {
    'UAE': 'ae', 'Kuwait': 'kw', 'Iraq': 'iq',
    'Bahrain': 'bh', 'Egypt': 'eg', 'Qatar': 'qa',
  }
  const countryCode = countryMap[country] || country.toLowerCase()
  const campaignReferenceId = `other_rmo_${countryCode}_PartnerFunded_${safePartnerName}${creditValue}AED_${startDate}-${endDate}_vw_1x${creditValue}AED_all_${cycleKey}_bth`

  const titleEn = `AED ${creditValue} voucher from your employer`
  const titleAr = `قسيمة بقيمة ${creditValue} درهم من صاحب العمل`

  const recipients = emails.map(email => ({
    external_user_id: email,
  }))

  const body = {
    canvas_id: VOUCHER_WALLET_CANVAS_ID,
    recipients,
    canvas_entry_properties: {
      credit_amount: Math.round(creditValue * 100),
      discount_value: Math.round(creditValue * 100),
      discount_type: discountType || 'FLAT',
      max_discount_cap: creditValue,
      min_order_value: minOrderValue,
      validity_voucher: validTillUTC,
      country_credit_id: countryCode.toUpperCase(),
      campaign_reference_id: campaignReferenceId,
      partner_name: partnerName,
      title_en: titleEn,
      title_ar: titleAr,
    },
    broadcast: false,
  }

  const res = await fetch(`${BRAZE_API_URL}/canvas/trigger/send`, {
    method: 'POST',
    headers: brazeHeaders(),
    body: JSON.stringify(body),
  })

  const data = await res.json()
  if (!res.ok) {
    return { ok: false, error: JSON.stringify(data.errors || data.message) }
  }
  return { ok: true }
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size))
  return chunks
}
