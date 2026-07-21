import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db, budgetAccounts } from '@/db'
import { eq } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const { amount } = await req.json()
  if (!amount || amount < 1000) return NextResponse.json({ error: 'Minimum top-up is AED 1,000' }, { status: 400 })

  const current = await db.select().from(budgetAccounts).where(eq(budgetAccounts.partnerId, session.id)).get()
  if (!current) return NextResponse.json({ error: 'Account not found' }, { status: 404 })

  await db.update(budgetAccounts).set({
    balance: current.balance + amount,
    totalTopUp: current.totalTopUp + amount,
    updatedAt: new Date().toISOString(),
  }).where(eq(budgetAccounts.partnerId, session.id))

  const updated = await db.select().from(budgetAccounts).where(eq(budgetAccounts.partnerId, session.id)).get()
  return NextResponse.json({ ok: true, account: updated })
}
