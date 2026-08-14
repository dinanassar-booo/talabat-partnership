'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Download, RefreshCw, Plus, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

type Code = { id: string; code: string; employee_email: string | null; status: string; expires_at: string }
type Stats = { total: string; pending: string; redeemed: string; expired: string }

export default function CodesPage() {
  const { id: campaignId } = useParams()
  const [codes, setCodes] = useState<Code[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [generating, setGenerating] = useState(false)
  const [count, setCount] = useState('10')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => { load() }, [campaignId])

  async function load() {
    const res = await fetch(`/api/campaigns/generate-codes?campaignId=${campaignId}`)
    const data = await res.json()
    setCodes(data.codes || [])
    setStats(data.stats || null)
  }

  async function generate() {
    setGenerating(true); setError(''); setSuccess('')
    const res = await fetch('/api/campaigns/generate-codes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaignId, count: parseInt(count) })
    })
    const data = await res.json()
    setGenerating(false)
    if (!res.ok) { setError(data.error || 'Failed'); return }
    setSuccess(`✓ ${data.generated} codes generated`)
    load()
  }

  function download() {
    const csv = ['Code,Status,Expires At,Employee Email',
      ...codes.map(c => `${c.code},${c.status},${c.expires_at},${c.employee_email || ''}`)
    ].join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `benefit-codes-${campaignId}.csv`
    a.click()
  }

  const statusStyle: Record<string, { bg: string; color: string }> = {
    pending: { bg: '#F0EFE9', color: '#5f5e5a' },
    redeemed: { bg: '#EDF7E6', color: '#3B6D11' },
    expired: { bg: '#FCEBEB', color: '#A32D2D' },
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <Link href="/dashboard/campaigns" style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#888', fontSize: 13, textDecoration: 'none', marginBottom: 6 }}>
            <ArrowLeft size={14} /> Campaigns
          </Link>
          <h1 style={{ fontSize: 20, fontWeight: 500, margin: 0 }}>Benefit Codes</h1>
          <p style={{ color: '#888', fontSize: 13, margin: '4px 0 0' }}>Generate and manage unique codes for this campaign.</p>
        </div>
        {codes.length > 0 && (
          <button onClick={download} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: '0.5px solid #e0dfd7', background: 'transparent', color: '#5f5e5a' }}>
            <Download size={14} /> Download CSV
          </button>
        )}
      </div>

      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Total codes', value: stats.total },
            { label: 'Pending', value: stats.pending },
            { label: 'Redeemed', value: stats.redeemed },
            { label: 'Expired', value: stats.expired },
          ].map(s => (
            <div key={s.label} style={{ background: '#F7F6F3', borderRadius: 8, padding: '12px 16px' }}>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 20, fontWeight: 500 }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      <div className="card" style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 15, fontWeight: 500, margin: '0 0 14px' }}>Generate codes</h2>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
          <div style={{ width: 160 }}>
            <label className="form-label">Number of codes</label>
            <input className="form-input" type="number" min="1" max="10000" value={count} onChange={e => setCount(e.target.value)} />
          </div>
          <button className="btn-tlb" onClick={generate} disabled={generating} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={14} /> {generating ? 'Generating…' : 'Generate codes'}
          </button>
          <button onClick={load} style={{ padding: '9px 12px', borderRadius: 8, border: '0.5px solid #e0dfd7', background: 'transparent', cursor: 'pointer' }}>
            <RefreshCw size={14} color="#888" />
          </button>
        </div>
        {error && <div style={{ marginTop: 10, color: '#A32D2D', fontSize: 13 }}>{error}</div>}
        {success && <div style={{ marginTop: 10, color: '#3B6D11', fontSize: 13 }}>{success}</div>}
      </div>

      {codes.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px', color: '#aaa' }}>
          No codes yet. Generate your first batch above.
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>{['Code', 'Status', 'Employee', 'Expires'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, color: '#888', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '0.5px solid #e0dfd7' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {codes.map(c => (
                <tr key={c.id} style={{ borderBottom: '0.5px solid #f0efe7' }}>
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 12, letterSpacing: '0.05em', fontWeight: 500 }}>{c.code}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 4, background: statusStyle[c.status]?.bg || '#F0EFE9', color: statusStyle[c.status]?.color || '#888' }}>{c.status}</span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#888' }}>{c.employee_email || '—'}</td>
                  <td style={{ padding: '12px 16px', color: '#888' }}>{new Date(c.expires_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
