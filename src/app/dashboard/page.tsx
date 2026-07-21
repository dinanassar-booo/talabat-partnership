import { getSession } from '@/lib/auth'
import { getDb } from '@/db'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { TrendingUp, Users, ShoppingBag, Banknote, Plus, ArrowRight } from 'lucide-react'

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  const sql = getDb()

  const [empCount, campaigns, budget] = await Promise.all([
    sql`SELECT COUNT(*) as cnt FROM employees WHERE partner_id = ${session.id} AND status = 'active'`,
    sql`SELECT c.*, bt.name as benefit_name FROM campaigns c JOIN benefit_types bt ON c.benefit_type_id = bt.id WHERE c.partner_id = ${session.id} ORDER BY c.created_at DESC LIMIT 10`,
    sql`SELECT * FROM budget_accounts WHERE partner_id = ${session.id} LIMIT 1`,
  ])

  const totalGmv = campaigns.reduce((s: number, c: Record<string, unknown>) => s + Number(c.budget_used), 0)
  const activeCampaigns = campaigns.filter((c: Record<string, unknown>) => c.status === 'active')

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 500, margin: 0 }}>Dashboard</h1>
        <p style={{ color: '#888', fontSize: 13, margin: '4px 0 0' }}>{session.companyName} · {session.country}</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Active employees', value: Number(empCount[0].cnt).toLocaleString(), icon: Users, color: '#185FA5' },
          { label: 'GMV this month', value: `AED ${Math.round(totalGmv).toLocaleString()}`, icon: TrendingUp, color: '#FF6B00' },
          { label: 'Active campaigns', value: activeCampaigns.length, icon: ShoppingBag, color: '#3B6D11' },
          { label: 'Budget balance', value: `AED ${Math.round(Number(budget[0]?.balance ?? 0)).toLocaleString()}`, icon: Banknote, color: '#854F0B' },
        ].map(m => (
          <div key={m.label} style={{ background: '#F7F6F3', borderRadius: 8, padding: '14px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>{m.label}</div>
              <m.icon size={14} color={m.color} />
            </div>
            <div style={{ fontSize: 22, fontWeight: 500, color: m.color }}>{m.value}</div>
          </div>
        ))}
      </div>
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 15, fontWeight: 500, margin: 0 }}>Campaigns</h2>
          <Link href="/dashboard/benefits"><button className="btn-tlb" style={{ fontSize: 12, padding: '6px 12px' }}><Plus size={13} /> New campaign</button></Link>
        </div>
        {campaigns.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#aaa' }}>
            <Link href="/dashboard/onboarding" style={{ color: '#FF6B00', fontSize: 13 }}>Complete onboarding to get started →</Link>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr>{['Campaign','Benefit','Headcount','Budget used','Status'].map(h => (
              <th key={h} style={{ textAlign: 'left', padding: '8px 10px', fontSize: 11, color: '#888', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '0.5px solid #e0dfd7' }}>{h}</th>
            ))}</tr></thead>
            <tbody>{campaigns.map((c: Record<string, unknown>) => (
              <tr key={c.id as string} style={{ borderBottom: '0.5px solid #f0efe7' }}>
                <td style={{ padding: '11px 10px', fontWeight: 500 }}>{c.name as string}</td>
                <td style={{ padding: '11px 10px' }}><span className="badge badge-orange">{c.benefit_name as string}</span></td>
                <td style={{ padding: '11px 10px', color: '#5f5e5a' }}>{Number(c.headcount).toLocaleString()}</td>
                <td style={{ padding: '11px 10px', color: '#5f5e5a' }}>AED {Math.round(Number(c.budget_used)).toLocaleString()} / {Math.round(Number(c.budget_total)).toLocaleString()}</td>
                <td style={{ padding: '11px 10px' }}><span className={`badge badge-${c.status}`}>{c.status as string}</span></td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {[
          { label: 'Manage employees', sub: `${Number(empCount[0].cnt).toLocaleString()} active`, href: '/dashboard/employees' },
          { label: 'Onboarding checklist', sub: session.status === 'active' ? 'All steps complete' : 'Setup in progress', href: '/dashboard/onboarding' },
        ].map(item => (
          <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
            <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
              <div><div style={{ fontWeight: 500, fontSize: 14 }}>{item.label}</div><div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{item.sub}</div></div>
              <ArrowRight size={16} color="#aaa" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
