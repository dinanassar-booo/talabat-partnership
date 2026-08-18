import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const slug = searchParams.get('slug')
  if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 })

  const sql = getDb()
  const partners = await sql`
    SELECT company_name, slug FROM partners WHERE slug = ${slug} LIMIT 1
  `
  if (!partners[0]) return NextResponse.json({ error: 'Company not found' }, { status: 404 })

  return NextResponse.json({
    companyName: partners[0].company_name,
    slug: partners[0].slug,
  })
}
