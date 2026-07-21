import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db, benefitTypes } from '@/db'
import { eq } from 'drizzle-orm'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const benefits = await db.select().from(benefitTypes).where(eq(benefitTypes.isActive, true))
  return NextResponse.json({ benefits })
}
