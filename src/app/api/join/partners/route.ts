import { NextResponse } from 'next/server'
import { getDb } from '@/db'

export async function GET() {
  const sql = getDb()
  const partners = await sql`
    SELECT company_name, slug FROM partners 
    WHERE slug IS NOT NULL 
    ORDER BY company_name ASC
  `
  return NextResponse.json({
    partners: partners.map(p => ({
      companyName: p.company_name,
      slug: p.slug,
    }))
  })
}
