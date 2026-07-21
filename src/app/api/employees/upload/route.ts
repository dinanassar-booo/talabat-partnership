import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/db'
import { hashEmployeeId, parseEmployeeCsv } from '@/lib/hash'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const mode = (formData.get('mode') as string) || 'add'
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  const content = await file.text()
  const { valid, errors } = parseEmployeeCsv(content)
  if (valid.length === 0) return NextResponse.json({ error: 'No valid employee IDs found', errors }, { status: 400 })

  const sql = getDb()
  const batchId = 'batch_' + crypto.randomBytes(6).toString('hex')
  await sql`INSERT INTO upload_batches (id, partner_id, filename, total_rows, status) VALUES (${batchId}, ${session.id}, ${file.name}, ${valid.length + errors.length}, 'processing')`

  if (mode === 'replace') {
    await sql`UPDATE employees SET status = 'removed', removed_at = NOW() WHERE partner_id = ${session.id} AND status = 'active'`
  }

  let added = 0, skipped = 0
  for (const empId of valid) {
    const empIdHash = hashEmployeeId(session.id, empId)
    const existing = await sql`SELECT id, status FROM employees WHERE partner_id = ${session.id} AND emp_id_hash = ${empIdHash} LIMIT 1`
    if (existing[0]) {
      if (existing[0].status === 'removed') {
        await sql`UPDATE employees SET status = 'active', removed_at = NULL WHERE id = ${existing[0].id}`
        added++
      } else skipped++
    } else {
      const eid = 'emp_' + crypto.randomBytes(8).toString('hex')
      await sql`INSERT INTO employees (id, partner_id, emp_id_hash) VALUES (${eid}, ${session.id}, ${empIdHash})`
      added++
    }
  }

  await sql`UPDATE upload_batches SET added = ${added}, errors = ${errors.length}, status = 'done' WHERE id = ${batchId}`
  const count = await sql`SELECT COUNT(*) as cnt FROM employees WHERE partner_id = ${session.id} AND status = 'active'`
  return NextResponse.json({ ok: true, batchId, added, skipped, errors: errors.length, totalActive: Number(count[0].cnt) })
}
