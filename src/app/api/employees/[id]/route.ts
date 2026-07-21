import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db, employees } from '@/db'
import { eq } from 'drizzle-orm'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const { id } = await params
  const emp = await db.select().from(employees).where(eq(employees.id, id)).get()
  if (!emp || emp.partnerId !== session.id) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  await db.update(employees).set({ status: 'removed', removedAt: new Date().toISOString() }).where(eq(employees.id, id))
  return NextResponse.json({ ok: true })
}
