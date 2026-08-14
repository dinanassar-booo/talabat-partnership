import { getSession } from '@/lib/auth'
import { getDb } from '@/db'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { TrendingUp, ShoppingBag, Banknote, Plus, ArrowRight, Link2 } from 'lucide-react'

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  const sql = getDb()

  const [campaigns, budget, partner] = await Promise.all([
    sql`SELECT c.*, bt.name as benefit_name FROM campaigns c JOIN benefit_types bt ON c.benefit_type_id = bt.id WHERE c.partner_id = ${session.id} ORDER BY c.created_at DESC LIMIT 10`,
    sql`SELECT * FROM budget_accounts WHERE partner_id = ${session.id} LIMIT 1`,
    sql`SELECT slug FROM partners WHERE id = ${session.id} LIMIT 1`,
  ])

  const totalGmv = campaigns.reduce((s: number, c: Record<string, unknown>) => s + Number(c.budget_used), 0)
  const activeCampaigns = campaigns.filter((c: Record<string, unknown>) => c.status === 'active')
  const slug = partner[0]?.slug || ''
  const joinLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://talabat-partnership.vercel.app'}/join/${slug}`

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 500, margin: 0 }}>Dashboard</h1>
        <p style={{ color: '#888', fontSize: 13, margin: '4px 0 0' }}>{session.companyName} · {session.country}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 24 }}>
        {[
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

      {/* Employee join link */}
      {slug && (
        <div className="card" style={{ marginBottom: 20, background: '#FFF8F4', border: '0.5px solid #FFB380' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <Link2 size={16} color="#FF6B00" />
            <h2 style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>Employee join link</h2>
          </div>
          <p style={{ fontSize: 12, color: '#888', margin: '0 0 10px' }}>Share this link with your employees so they can claim their benefit.</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, background: '#fff', border: '0.5px solid #e0dfd7', borderRadius: 6, padding: '8px 12px', fontSize: 12, fontFamily: 'monospace', color: '#5f5e5a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {joinLink}
            </div>
            <button
              onClick={undefined}
              id="copy-join-link"
              data-link={joinLink}
              style={{ padding: '8px 14px', background: '#FF6B00', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              Copy link
            </button>
          </div>
        </div>
      )}

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 15, fontWeight: 500, margin: 0 }}>Campaigns</h2>
          <Link href="/dashboard/campaigns/new"><button className="btn-tlb" style={{ fontSize: 12, padding: '6px 12px' }}><Plus size={13} /> New campaign</button></Link>
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
          { label: 'Onboarding checklist', sub: session.status === 'active' ? 'All steps complete' : 'Setup in progress', href: '/dashboard/onboarding' },
          { label: 'Billing', sub: `AED ${Math.round(Number(budget[0]?.balance ?? 0)).toLocaleString()} available`, href: '/dashboard/billing' },
        ].map(item => (
          <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
            <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
              <div><div style={{ fontWeight: 500, fontSize: 14 }}>{item.label}</div><div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{item.sub}</div></div>
              <ArrowRight size={16} color="#aaa" />
            </div>
          </Link>
        ))}
      </div>

      <script dangerouslySetInnerHTML={{ __html: `
        document.getElementById('copy-join-link')?.addEventListener('click', function() {
          navigator.clipboard.writeText(this.dataset.link).then(() => {
            this.textContent = 'Copied!';
            setTimeout(() => this.textContent = 'Copy link', 2000);
          });
        });
      `}} />
    </div>
  )
}
