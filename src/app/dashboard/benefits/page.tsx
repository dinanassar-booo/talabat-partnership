import { getSession } from '@/lib/auth'
import { db, benefitTypes, campaigns } from '@/db'
import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { Wallet, Ticket, Star, UtensilsCrossed } from 'lucide-react'
import Link from 'next/link'

const ICONS: Record<string, React.ElementType> = { voucher_wallet: Wallet, single_use_code: Ticket, tpro: Star, dine_out: UtensilsCrossed }
const COLORS: Record<string, string> = { voucher_wallet: '#FF6B00', single_use_code: '#4285F4', tpro: '#7F77DD', dine_out: '#2E7D32' }

export default async function BenefitsPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const [types, active] = await Promise.all([
    db.select().from(benefitTypes).where(eq(benefitTypes.isActive, true)),
    db.select({ benefitTypeId: campaigns.benefitTypeId }).from(campaigns).where(eq(campaigns.partnerId, session.id)),
  ])
  const activeIds = new Set(active.map(c => c.benefitTypeId))

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 500, margin: 0 }}>Benefits catalog</h1>
        <p style={{ color: '#888', fontSize: 13, margin: '4px 0 0' }}>Choose a benefit type to configure a new campaign.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {types.map(b => {
          const Icon = ICONS[b.slug] || Wallet
          const color = COLORS[b.slug] || '#FF6B00'
          const isActive = activeIds.has(b.id)
          return (
            <div key={b.id} className="card">
              <div style={{ width: 40, height: 40, borderRadius: 9, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <Icon size={20} color="#fff" />
              </div>
              <div style={{ fontWeight: 500, fontSize: 15, marginBottom: 4 }}>{b.name}</div>
              <div style={{ fontSize: 13, color: '#888', lineHeight: 1.5, marginBottom: 12 }}>{b.description}</div>
              <span className={isActive ? 'badge badge-active' : 'badge badge-pending'}>
                {isActive ? 'Active campaign' : 'Not configured'}
              </span>
              <div style={{ marginTop: 14 }}>
                <Link href={`/dashboard/campaigns/new?benefit=${b.id}`}>
                  <button className="btn-tlb" style={{ fontSize: 12, padding: '6px 14px' }}>
                    {isActive ? 'Add another campaign' : 'Set up campaign'}
                  </button>
                </Link>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
