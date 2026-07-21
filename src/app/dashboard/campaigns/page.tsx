import { getSession } from '@/lib/auth'
import { getDb } from '@/db'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, BarChart2 } from 'lucide-react'

export default async function CampaignsPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  const sql = getDb()
  const rows = await sql`SELECT c.*, bt.name as benefit_name FROM campaigns c JOIN benefit_types bt ON c.benefit_type_id = bt.id WHERE c.partner_id = ${session.id} ORDER BY c.created_at DESC`

  const totalGmv = rows.reduce((s: number, r: Record<string, unknown>) => s + Number(r.budget_used), 0)
  const totalBudget = rows.reduce((s: number, r: Record<string, unknown>) => s + Number(r.budget_total), 0)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 500, margin: 0 }}>Campaigns</h1>
          <p style={{ color: '#888', fontSize: 13, margin: '4px 0 0' }}>Track all benefit campaigns across your employee base.</p>
        </div>
        <Link href="/dashboard/benefits"><button className="btn-tlb"><Plus size={14} /> New campaign</button></Link>
      </div>
      {rows.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Total campaigns', value: rows.length },
            { label: 'Total budget', value: `AED ${Math.round(totalBudget).toLocaleString()}` },
            { label: 'Total GMV generated', value: `AED ${Math.round(totalGmv).toLocaleString()}` },
          ].map(m => (
            <div key={m.label} style={{ background: '#F7F6F3', borderRadius: 8, padding: '12px 16px' }}>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>{m.label}</div>
              <div style={{ fontSize: 18, fontWeight: 500 }}>{m.value}</div>
            </div>
          ))}
        </div>
      )}
      {rows.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <BarChart2 size={32} color="#d1d0c9" style={{ margin: '0 auto 12px' }} />
          <div style={{ fontWeight: 500, marginBottom: 6 }}>No campaigns yet</div>
          <Link href="/dashboard/benefits"><button className="btn-tlb"><Plus size={14} /> Set up a benefit</button></Link>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr>{['Campaign','Benefit','Employees','Credit/cycle','Budget used','Status'].map(h => (
              <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, color: '#888', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '0.5px solid #e0dfd7' }}>{h}</th>
            ))}</tr></thead>
            <tbody>{rows.map((c: Record<string, unknown>) => {
              const pct = Number(c.budget_total) > 0 ? Math.round((Number(c.budget_used) / Number(c.budget_total)) * 100) : 0
              return (
                <tr key={c.id as string} style={{ borderBottom: '0.5px solid #f0efe7' }}>
                  <td style={{ padding: '13px 16px', fontWeight: 500 }}>{c.name as string}</td>
                  <td style={{ padding: '13px 16px' }}><span className="badge badge-orange">{c.benefit_name as string}</span></td>
                  <td style={{ padding: '13px 16px', color: '#5f5e5a' }}>{Number(c.headcount).toLocaleString()}</td>
                  <td style={{ padding: '13px 16px', color: '#5f5e5a' }}>AED {Number(c.credit_value)} / {(c.cycle_type as string).replace('_',' ')}</td>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 4, background: '#e0dfd7', borderRadius: 2 }}>
                        <div style={{ height: '100%', background: '#FF6B00', borderRadius: 2, width: `${pct}%` }} />
                      </div>
                      <span style={{ fontSize: 12 }}>{pct}%</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>AED {Math.round(Number(c.budget_used)).toLocaleString()} / {Math.round(Number(c.budget_total)).toLocaleString()}</div>
                  </td>
                  <td style={{ padding: '13px 16px' }}><span className={`badge badge-${c.status}`}>{c.status as string}</span></td>
                </tr>
              )
            })}</tbody>
          </table>
        </div>
      )}
    </div>
  )
}
