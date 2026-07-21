import { NextRequest, NextResponse } from 'next/server'
import { db, partners, budgetAccounts } from '@/db'
import { eq, or } from 'drizzle-orm'
import { hashPassword, signToken, COOKIE_NAME } from '@/lib/auth'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  const { companyName, tradeNumber, country, industry, adminName, adminEmail, password, tcAccepted } = await req.json()
  if (!companyName || !tradeNumber || !adminEmail || !password || !adminName) return NextResponse.json({ error: 'All fields required' }, { status: 400 })
  if (!tcAccepted) return NextResponse.json({ error: 'You must accept the terms' }, { status: 400 })
  if (password.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })

  const existing = await db.select().from(partners).where(or(eq(partners.adminEmail, adminEmail), eq(partners.tradeNumber, tradeNumber))).get()
  if (existing) return NextResponse.json({ error: 'Account with this email or trade number already exists' }, { status: 409 })

  const id = 'partner_' + crypto.randomBytes(8).toString('hex')
  const passwordHash = await hashPassword(password)

  await db.insert(partners).values({ id, companyName, tradeNumber, country: country || 'UAE', industry: industry || 'Other', adminName, adminEmail, passwordHash, status: 'onboarding', tcAcceptedAt: new Date().toISOString() })
  await db.insert(budgetAccounts).values({ id: 'budget_' + id, partnerId: id, balance: 0, totalTopUp: 0, totalSpent: 0 })

  const token = signToken(id)
  const res = NextResponse.json({ ok: true }, { status: 201 })
  res.cookies.set(COOKIE_NAME, token, { httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 7, path: '/' })
  return res
}
