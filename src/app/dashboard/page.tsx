import { getSession } from '@/lib/auth'
import { db, employees, campaigns, benefitTypes, budgetAccounts } from '@/db'
import { eq, and, count, desc } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { TrendingUp, Users, ShoppingBag, Banknote, Plus, ArrowRight } from 'lucide-react'

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const [
    [{ empCount }],
    campaignList,
    budget,
  ] = await Promise.all([
    db.select({ empCount: count() }).from(employees).where(and(eq(employees.partnerId, session.id), eq(employees.status, 'active'))),
    db.select({ c: campaigns, bt: benefitTypes })
      .from(campaigns)
      .leftJoin(benefitTypes, eq(campaigns.benefitTypeId, benefitTypes.id))
      .where(eq(campaigns.partnerId, session.id))
      .orderBy(desc(campaigns.createdAt))
      .limit(10),
    db.select().from(budgetAccounts).where(eq(budgetAccounts.partnerId, session.id)).get(),
  ])

  const activeCampaigns = campaignList.filter(r => r.c.status === 'active')
  const totalGmv = campaignList.reduce((s, r) => s + r.c.budgetUsed, 0)

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 500, margin: 0 }}>Dashboard</h1>
        <p style={{ color: '#888', fontSize: 13, margin: '4px 0 0' }}>{session.companyName} · {session.country}</p>
      </div>

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Active employees', value: empCount.toLocaleString(), sub: 'enrolled', icon: Users, color: '#185FA5' },
          { label: 'GMV this month', value: `AED ${Math.round(totalGmv).toLocaleString()}`, sub: 'all campaigns', icon: TrendingUp, color: '#FF6B00' },
          { label: 'Active campaigns', value: activeCampaigns.length, sub: `${campaignList.length} total`, icon: ShoppingBag, color: '#3B6D11' },
          { label: 'Budget balance', value: `AED ${Math.round(budget?.balance ?? 0).toLocaleString()}`, sub: 'available', icon: Banknote, color: '#854F0B' },
        ].map(m => (
          <div key={m.label} style={{ background: '#F7F6F3', borderRadius: 8, padding: '14px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>{m.label}</div>
              <m.icon size={14} color={m.color} />
            </div>
            <div style={{ fontSize: 22, fontWeight: 500, color: m.color }}>{m.value}</div>
            <div style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Campaigns */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 15, fontWeight: 500, margin: 0 }}>Campaigns</h2>
          <Link href="/dashboard/benefits"><button className="btn-tlb" style={{ fontSize: 12, padding: '6px 12px' }}><Plus size={13} /> New campaign</button></Link>
        </div>
        {campaignList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#aaa' }}>
            <p style={{ margin: '0 0 10px' }}>No campaigns yet.</p>
            <Link href="/dashboard/onboarding" style={{ color: '#FF6B00', fontSize: 13 }}>Complete onboarding to get started →</Link>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>{['Campaign','Benefit','Headcount','Budget used','Status'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '8px 10px', fontSize: 11, color: '#888', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '0.5px solid #e0dfd7' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {campaignList.map(({ c, bt }) => (
                <tr key={c.id} style={{ borderBottom: '0.5px solid #f0efe7' }}>
                  <td style={{ padding: '11px 10px', fontWeight: 500 }}>{c.name}</td>
                  <td style={{ padding: '11px 10px' }}><span className="badge badge-orange">{bt?.name ?? '—'}</span></td>
                  <td style={{ padding: '11px 10px', color: '#5f5e5a' }}>{c.headcount.toLocaleString()}</td>
                  <td style={{ padding: '11px 10px', color: '#5f5e5a' }}>AED {Math.round(c.budgetUsed).toLocaleString()} / {Math.round(c.budgetTotal).toLocaleString()}</td>
                  <td style={{ padding: '11px 10px' }}><span className={`badge badge-${c.status}`}>{c.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Quick links */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {[
          { label: 'Manage employees', sub: `${empCount.toLocaleString()} active`, href: '/dashboard/employees' },
          { label: 'Onboarding checklist', sub: session.status === 'active' ? 'All steps complete' : 'Setup in progress', href: '/dashboard/onboarding' },
        ].map(item => (
          <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
            <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
              <div>
                <div style={{ fontWeight: 500, fontSize: 14 }}>{item.label}</div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{item.sub}</div>
              </div>
              <ArrowRight size={16} color="#aaa" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
