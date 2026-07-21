import { NextRequest, NextResponse } from 'next/server'
import { db, partners } from '@/db'
import { eq } from 'drizzle-orm'
import { verifyPassword, signToken, COOKIE_NAME } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()
  if (!email || !password) return NextResponse.json({ error: 'Email and password required' }, { status: 400 })

  const partner = await db.select().from(partners).where(eq(partners.adminEmail, email)).get()
  if (!partner) return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })

  const valid = await verifyPassword(password, partner.passwordHash)
  if (!valid) return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })

  const token = signToken(partner.id)
  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE_NAME, token, { httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 7, path: '/' })
  return res
}
