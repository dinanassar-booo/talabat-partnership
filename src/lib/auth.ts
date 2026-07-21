import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { getDb } from '@/db'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production'
export const COOKIE_NAME = 'tlb_partner_session'

export async function hashPassword(p: string) { return bcrypt.hash(p, 12) }
export async function verifyPassword(p: string, h: string) { return bcrypt.compare(p, h) }
export function signToken(partnerId: string) { return jwt.sign({ partnerId }, JWT_SECRET, { expiresIn: '7d' }) }
export function verifyToken(token: string): { partnerId: string } | null {
  try { return jwt.verify(token, JWT_SECRET) as { partnerId: string } } catch { return null }
}

export async function getSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  const payload = verifyToken(token)
  if (!payload) return null
  const sql = getDb()
  const rows = await sql`SELECT id, company_name, admin_name, admin_email, status, country, industry FROM partners WHERE id = ${payload.partnerId}`
  if (!rows[0]) return null
  const r = rows[0]
  return { id: r.id as string, companyName: r.company_name as string, adminName: r.admin_name as string, adminEmail: r.admin_email as string, status: r.status as string, country: r.country as string, industry: r.industry as string }
}
