import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/db'
import { verifyPassword, signToken, COOKIE_NAME } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()
  if (!email || !password) return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
  const sql = getDb()
  const rows = await sql`SELECT id, password_hash FROM partners WHERE admin_email = ${email} LIMIT 1`
  if (!rows[0]) return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
  const valid = await verifyPassword(password, rows[0].password_hash as string)
  if (!valid) return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
  const token = signToken(rows[0].id as string)
  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE_NAME, token, { httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 7, path: '/' })
  return res
}
