import crypto from 'crypto'

export function hashEmployeeId(partnerId: string, employeeId: string): string {
  return crypto
    .createHmac('sha256', partnerId)
    .update(employeeId.trim().toLowerCase())
    .digest('hex')
}

export function parseEmployeeCsv(content: string): {
  valid: string[]
  errors: string[]
} {
  const lines = content.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  const valid: string[] = []
  const errors: string[] = []

  const firstLine = lines[0]?.toLowerCase() || ''
  const startIdx = (firstLine.includes('email') || firstLine.includes('employee')) ? 1 : 0

  for (let i = startIdx; i < lines.length; i++) {
    const value = lines[i].split(',')[0].trim().toLowerCase()
    if (!value) continue

    if (value.includes('@')) {
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        valid.push(value)
      } else {
        errors.push(`Row ${i + 1}: "${value}" is not a valid email address`)
      }
      continue
    }

    if (value.length < 2 || value.length > 64) {
      errors.push(`Row ${i + 1}: "${value}" invalid length`)
      continue
    }
    if (!/^[a-zA-Z0-9_\-]+$/.test(value)) {
      errors.push(`Row ${i + 1}: "${value}" contains invalid characters`)
      continue
    }
    valid.push(value)
  }

  return { valid, errors }
}

export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}
