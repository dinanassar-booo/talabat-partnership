import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { db, partners } from '@/db'
import { eq } from 'drizzle-orm'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production'
export const COOKIE_NAME = 'tlb_partner_session'

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function signToken(partnerId: string): string {
  return jwt.sign({ partnerId }, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): { partnerId: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { partnerId: string }
  } catch {
    return null
  }
}

export async function getSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  const payload = verifyToken(token)
  if (!payload) return null
  const partner = await db.select({
    id: partners.id,
    companyName: partners.companyName,
    adminName: partners.adminName,
    adminEmail: partners.adminEmail,
    status: partners.status,
    country: partners.country,
    industry: partners.industry,
  }).from(partners).where(eq(partners.id, payload.partnerId)).get()
  return partner ?? null
}
