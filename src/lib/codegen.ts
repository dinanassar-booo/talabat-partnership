import crypto from 'crypto'

const CODE_SECRET = process.env.CODE_SECRET || 'tlb-b2b-dev-secret'

export function generateBenefitCode(params: {
  partnerId: string
  campaignId: string
  benefitSlug: string
  creditValue: number
  country: string
  expiresAt: string
  index: number
}): string {
  const { partnerId, campaignId, benefitSlug, creditValue, country, expiresAt, index } = params
  const key = crypto.scryptSync(CODE_SECRET, 'salt', 32)
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const data = JSON.stringify({ pid: partnerId, cid: campaignId, val: creditValue, exp: expiresAt, idx: index })
  const encrypted = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  const encoded = Buffer.concat([iv, tag, encrypted])
    .toString('base64')
    .replace(/\+/g, '0').replace(/\//g, '1').replace(/=/g, '')
    .slice(0, 12).toUpperCase()
  const checksum = crypto.createHmac('sha256', CODE_SECRET).update(encoded).digest('hex').slice(0, 2).toUpperCase()
  const c = (country || 'AE').slice(0, 2).toUpperCase()
  const b = (benefitSlug || 'VW').slice(0, 2).toUpperCase()
  return `TLB-${c}-${b}-${encoded}-${checksum}`
}

export function generateCodeBatch(params: {
  partnerId: string
  campaignId: string
  benefitSlug: string
  creditValue: number
  country: string
  expiresAt: string
  count: number
}): string[] {
  return Array.from({ length: params.count }, (_, i) =>
    generateBenefitCode({ ...params, index: i })
  )
}
