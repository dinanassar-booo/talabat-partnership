import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/db'
import { hashPassword, signToken, COOKIE_NAME } from '@/lib/auth'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const { companyName, tradeNumber, country, industry, adminName, adminEmail, password, tcAccepted } = await req.json()
    if (!companyName || !tradeNumber || !adminEmail || !password || !adminName) return NextResponse.json({ error: 'All fields required' }, { status: 400 })
    if (!tcAccepted) return NextResponse.json({ error: 'You must accept the terms' }, { status: 400 })
    if (password.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })

    const sql = getDb()
    const existing = await sql`SELECT id FROM partners WHERE admin_email = ${adminEmail} OR trade_number = ${tradeNumber} LIMIT 1`
    if (existing.length > 0) return NextResponse.json({ error: 'Account with this email or trade number already exists' }, { status: 409 })

    const id = 'partner_' + crypto.randomBytes(8).toString('hex')
    const passwordHash = await hashPassword(password)

    await sql`INSERT INTO partners (id, company_name, trade_number, country, industry, admin_name, admin_email, password_hash, status, tc_accepted_at) VALUES (${id}, ${companyName}, ${tradeNumber}, ${country || 'UAE'}, ${industry || 'Other'}, ${adminName}, ${adminEmail}, ${passwordHash}, 'onboarding', NOW())`
    await sql`INSERT INTO budget_accounts (id, partner_id) VALUES (${'budget_' + id}, ${id})`

    const token = signToken(id)
    const res = NextResponse.json({ ok: true }, { status: 201 })
    res.cookies.set(COOKIE_NAME, token, { httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 7, path: '/' })
    return res
  } catch (err) {
    console.error('Signup error:', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
