import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db, employees, uploadBatches } from '@/db'
import { eq, and, count } from 'drizzle-orm'
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

  const batchId = 'batch_' + crypto.randomBytes(6).toString('hex')
  await db.insert(uploadBatches).values({ id: batchId, partnerId: session.id, filename: file.name, totalRows: valid.length + errors.length, status: 'processing' })

  if (mode === 'replace') {
    await db.update(employees).set({ status: 'removed', removedAt: new Date().toISOString() }).where(and(eq(employees.partnerId, session.id), eq(employees.status, 'active')))
  }

  let added = 0, skipped = 0
  for (const empId of valid) {
    const empIdHash = hashEmployeeId(session.id, empId)
    const existing = await db.select().from(employees).where(and(eq(employees.partnerId, session.id), eq(employees.empIdHash, empIdHash))).get()
    if (existing) {
      if (existing.status === 'removed') {
        await db.update(employees).set({ status: 'active', removedAt: null }).where(eq(employees.id, existing.id))
        added++
      } else skipped++
    } else {
      await db.insert(employees).values({ id: 'emp_' + crypto.randomBytes(8).toString('hex'), partnerId: session.id, empIdHash, status: 'active' })
      added++
    }
  }

  await db.update(uploadBatches).set({ added, errors: errors.length, status: 'done' }).where(eq(uploadBatches.id, batchId))
  const [{ total }] = await db.select({ total: count() }).from(employees).where(and(eq(employees.partnerId, session.id), eq(employees.status, 'active')))

  return NextResponse.json({ ok: true, batchId, added, skipped, errors: errors.length, errorDetails: errors.slice(0, 5), totalActive: total })
}
