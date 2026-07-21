import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db, budgetAccounts } from '@/db'
import { eq } from 'drizzle-orm'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const account = await db.select().from(budgetAccounts).where(eq(budgetAccounts.partnerId, session.id)).get()
  return NextResponse.json({ account })
}
