import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db, campaigns, benefitTypes } from '@/db'
import { eq } from 'drizzle-orm'
import crypto from 'crypto'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const list = await db.select({ c: campaigns, bt: benefitTypes })
    .from(campaigns)
    .leftJoin(benefitTypes, eq(campaigns.benefitTypeId, benefitTypes.id))
    .where(eq(campaigns.partnerId, session.id))
  return NextResponse.json({ campaigns: list })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { benefitTypeId, name, creditValue, cycleType, headcount, budgetTotal } = await req.json()

  if (!benefitTypeId || !name || !creditValue || !headcount || !budgetTotal) {
    return NextResponse.json({ error: 'All fields required' }, { status: 400 })
  }

  const benefit = await db.select().from(benefitTypes).where(eq(benefitTypes.id, benefitTypeId)).get()
  if (!benefit) return NextResponse.json({ error: 'Invalid benefit type' }, { status: 400 })

  const id = 'camp_' + crypto.randomBytes(8).toString('hex')
  await db.insert(campaigns).values({
    id,
    partnerId: session.id,
    benefitTypeId,
    name,
    creditValue: parseFloat(creditValue),
    cycleType,
    headcount: parseInt(headcount),
    budgetTotal: parseFloat(budgetTotal),
    budgetUsed: 0,
    status: 'pending',
    brazeCanvasId: benefit.brazeCanvasId ? `${benefit.brazeCanvasId}_${id}` : null,
    startsAt: new Date().toISOString(),
  })

  return NextResponse.json({ ok: true, id }, { status: 201 })
}
