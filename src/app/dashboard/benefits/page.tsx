import { getSession } from '@/lib/auth'
import { getDb } from '@/db'
import { redirect } from 'next/navigation'
import { Wallet, Ticket, Star, UtensilsCrossed } from 'lucide-react'
import Link from 'next/link'

const ICONS: Record<string, React.ElementType> = { voucher_wallet: Wallet, single_use_code: Ticket, tpro: Star, dine_out: UtensilsCrossed }
const COLORS: Record<string, string> = { voucher_wallet: '#FF6B00', single_use_code: '#4285F4', tpro: '#7F77DD', dine_out: '#2E7D32' }

export default async function BenefitsPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  const sql = getDb()
  const [types, active] = await Promise.all([
    sql`SELECT * FROM benefit_types WHERE is_active = TRUE ORDER BY name`,
    sql`SELECT benefit_type_id FROM campaigns WHERE partner_id = ${session.id}`,
  ])
  const activeIds = new Set(active.map((c: Record<string, unknown>) => c.benefit_type_id as string))

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 500, margin: 0 }}>Benefits catalog</h1>
        <p style={{ color: '#888', fontSize: 13, margin: '4px 0 0' }}>Choose a benefit type to configure a new campaign.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {types.map((b: Record<string, unknown>) => {
          const Icon = ICONS[b.slug as string] || Wallet
          const color = COLORS[b.slug as string] || '#FF6B00'
          const isActive = activeIds.has(b.id as string)
          return (
            <div key={b.id as string} className="card">
              <div style={{ width: 40, height: 40, borderRadius: 9, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}><Icon size={20} color="#fff" /></div>
              <div style={{ fontWeight: 500, fontSize: 15, marginBottom: 4 }}>{b.name as string}</div>
              <div style={{ fontSize: 13, color: '#888', lineHeight: 1.5, marginBottom: 12 }}>{b.description as string}</div>
              <span className={isActive ? 'badge badge-active' : 'badge badge-pending'}>{isActive ? 'Active campaign' : 'Not configured'}</span>
              <div style={{ marginTop: 14 }}>
                <Link href={`/dashboard/campaigns/new?benefit=${b.id}`}>
                  <button className="btn-tlb" style={{ fontSize: 12, padding: '6px 14px' }}>{isActive ? 'Add another campaign' : 'Set up campaign'}</button>
                </Link>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
