import crypto from 'crypto'

/**
 * Hash an employee ID for storage.
 * We combine the partnerId as a namespace so the same employee ID
 * at two different companies produces different hashes.
 * No raw employee data (name, email) ever enters our system.
 */
export function hashEmployeeId(partnerId: string, employeeId: string): string {
  return crypto
    .createHmac('sha256', partnerId)
    .update(employeeId.trim().toLowerCase())
    .digest('hex')
}

/**
 * Parse a CSV upload of employee IDs.
 * Expected format: one employee ID per line (or comma-separated header + rows).
 * Returns { valid: string[], errors: string[] }
 */
export function parseEmployeeCsv(content: string): {
  valid: string[]
  errors: string[]
} {
  const lines = content.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  const valid: string[] = []
  const errors: string[] = []

  // Skip header row if it looks like a header
  const startIdx = lines[0]?.toLowerCase().includes('employee') ? 1 : 0

  for (let i = startIdx; i < lines.length; i++) {
    const id = lines[i].split(',')[0].trim() // take first column if CSV
    if (!id) continue
    if (id.length < 2 || id.length > 64) {
      errors.push(`Row ${i + 1}: ID "${id}" invalid length`)
      continue
    }
    if (!/^[a-zA-Z0-9_\-]+$/.test(id)) {
      errors.push(`Row ${i + 1}: ID "${id}" contains invalid characters`)
      continue
    }
    valid.push(id)
  }

  return { valid, errors }
}
