import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/db'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const sql = getDb()
  const benefits = await sql`SELECT * FROM benefit_types WHERE is_active = TRUE ORDER BY name`
  return NextResponse.json({ benefits })
}
