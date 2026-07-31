'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, BarChart2 } from 'lucide-react'

type Campaign = {
  id: string; name: string; benefit_name: string; benefit_slug: string
  headcount: number; credit_value: number; cycle_type: string
  budget_used: number; budget_total: number; status: string
  min_order_value: number; validity_days: number
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [launching, setLaunching] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => { loadCampaigns() }, [])

  async function loadCampaigns() {
    const res = await fetch('/api/campaigns')
    const data = await res.json()
    setCampaigns(data.campaigns || [])
  }

  async function handleLaunch(campaignId: string) {
    setLaunching(campaignId); setError(''); setSuccess('')
    const res = await fetch('/api/campaigns/launch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaignId })
    })
    const data = await res.json()
    setLaunching(null)
    if (!res.ok) {
      setError(data.error || 'Failed to launch campaign')
    } else {
      setSuccess(`Campaign launched — ${data.employeesReached} employees reached via Braze`)
      loadCampaigns()
    }
  }

  const totalGmv = campaigns.reduce((s, c) => s + Number(c.budget_used), 0)
  const totalBudget = campaigns.reduce((s, c) => s + Number(c.budget_total), 0)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 500, margin: 0 }}>Campaigns</h1>
          <p style={{ color: '#888', fontSize: 13, margin: '4px 0 0' }}>Track all benefit campaigns across your employee base.</p>
        </div>
        <Link href="/dashboard/campaigns/new"><button className="btn-tlb"><Plus size={14} /> New campaign</button></Link>
      </div>

      {error && <div style={{ color: '#A32D2D', background: '#FCEBEB', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>{error}</div>}
      {success && <div style={{ color: '#3B6D11', background: '#EDF7E6', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>{success}</div>}

      {campaigns.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Total campaigns', value: campaigns.length },
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

      {campaigns.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <BarChart2 size={32} color="#d1d0c9" style={{ margin: '0 auto 12px' }} />
          <div style={{ fontWeight: 500, marginBottom: 6 }}>No campaigns yet</div>
          <Link href="/dashboard/campaigns/new"><button className="btn-tlb"><Plus size={14} /> Set up a benefit</button></Link>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr>{['Campaign', 'Benefit', 'Employees', 'Credit/cycle', 'Budget used', 'Status', ''].map(h => (
              <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, color: '#888', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '0.5px solid #e0dfd7' }}>{h}</th>
            ))}</tr></thead>
            <tbody>{campaigns.map(c => {
              const pct = Number(c.budget_total) > 0 ? Math.round((Number(c.budget_used) / Number(c.budget_total)) * 100) : 0
              return (
                <tr key={c.id} style={{ borderBottom: '0.5px solid #f0efe7' }}>
                  <td style={{ padding: '13px 16px', fontWeight: 500 }}>{c.name}</td>
                  <td style={{ padding: '13px 16px' }}><span className="badge badge-orange">{c.benefit_name}</span></td>
                  <td style={{ padding: '13px 16px', color: '#5f5e5a' }}>{Number(c.headcount).toLocaleString()}</td>
                  <td style={{ padding: '13px 16px', color: '#5f5e5a' }}>AED {Number(c.credit_value)} / {c.cycle_type.replace('_', ' ')}</td>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 4, background: '#e0dfd7', borderRadius: 2 }}>
                        <div style={{ height: '100%', background: '#FF6B00', borderRadius: 2, width: `${pct}%` }} />
                      </div>
                      <span style={{ fontSize: 12 }}>{pct}%</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>AED {Math.round(Number(c.budget_used)).toLocaleString()} / {Math.round(Number(c.budget_total)).toLocaleString()}</div>
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <span style={{
                      fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 4,
                      background: c.status === 'active' ? '#EDF7E6' : c.status === 'paused' ? '#FEF3CD' : '#F0EFE9',
                      color: c.status === 'active' ? '#3B6D11' : c.status === 'paused' ? '#7A5C00' : '#5f5e5a'
                    }}>{c.status}</span>
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    {c.status === 'pending' && (
                      <button
                        className="btn-tlb"
                        style={{ fontSize: 12, padding: '5px 12px' }}
                        disabled={launching === c.id}
                        onClick={() => handleLaunch(c.id)}
                      >
                        {launching === c.id ? 'Launching…' : 'Launch →'}
                      </button>
                    )}
                    {c.status === 'active' && (
                      <span style={{ fontSize: 12, color: '#3B6D11' }}>● Live</span>
                    )}
                    {c.status === 'paused' && (
                      <span style={{ fontSize: 12, color: '#7A5C00' }}>⚠ Paused</span>
                    )}
                  </td>
                </tr>
              )
            })}</tbody>
          </table>
        </div>
      )}
    </div>
  )
}
