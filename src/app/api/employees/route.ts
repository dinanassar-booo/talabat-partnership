import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db, employees } from '@/db'
import { eq, and, desc, count } from 'drizzle-orm'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const [list, [{ total }]] = await Promise.all([
    db.select().from(employees).where(eq(employees.partnerId, session.id)).orderBy(desc(employees.enrolledAt)).limit(50),
    db.select({ total: count() }).from(employees).where(and(eq(employees.partnerId, session.id), eq(employees.status, 'active'))),
  ])
  return NextResponse.json({ employees: list, totalActive: total })
}
