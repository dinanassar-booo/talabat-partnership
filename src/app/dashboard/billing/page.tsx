'use client'
import { useState, useEffect } from 'react'
import { CreditCard, ArrowUpCircle, Clock } from 'lucide-react'

type Account = { balance: number; totalTopUp: number; totalSpent: number }

export default function BillingPage() {
  const [account, setAccount] = useState<Account | null>(null)
  const [amount, setAmount] = useState('50000')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')

  useEffect(() => { fetch('/api/billing').then(r => r.json()).then(d => setAccount(d.account)) }, [])

  async function handleTopUp() {
    setLoading(true)
    const res = await fetch('/api/billing/topup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: parseFloat(amount) }) })
    const data = await res.json()
    if (res.ok) { setSuccess(`AED ${parseFloat(amount).toLocaleString()} added.`); setAccount(data.account) }
    setLoading(false)
  }

  const PRESETS = ['25000', '50000', '100000', '250000']

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 500, margin: 0 }}>Billing</h1>
        <p style={{ color: '#888', fontSize: 13, margin: '4px 0 0' }}>Manage your pre-paid budget account.</p>
      </div>

      {account && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Available balance', value: `AED ${Math.round(account.balance).toLocaleString()}`, color: account.balance > 0 ? '#3B6D11' : '#A32D2D' },
            { label: 'Total topped up', value: `AED ${Math.round(account.totalTopUp).toLocaleString()}`, color: '#1a1a18' },
            { label: 'Total spent', value: `AED ${Math.round(account.totalSpent).toLocaleString()}`, color: '#1a1a18' },
          ].map(m => (
            <div key={m.label} style={{ background: '#F7F6F3', borderRadius: 8, padding: '14px 16px' }}>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>{m.label}</div>
              <div style={{ fontSize: 22, fontWeight: 500, color: m.color }}>{m.value}</div>
            </div>
          ))}
        </div>
      )}

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 }}>
          <ArrowUpCircle size={18} color="#FF6B00" />
          <h2 style={{ fontSize: 15, fontWeight: 500, margin: 0 }}>Top up balance</h2>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label className="form-label">Amount (AED)</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
            {PRESETS.map(p => (
              <button key={p} type="button" onClick={() => setAmount(p)}
                style={{ padding: '5px 12px', borderRadius: 6, border: `0.5px solid ${amount === p ? '#FF6B00' : '#d1d0c9'}`, background: amount === p ? '#FFF8F4' : '#fff', fontSize: 13, cursor: 'pointer', color: amount === p ? '#FF6B00' : '#1a1a18' }}>
                {parseInt(p).toLocaleString()}
              </button>
            ))}
          </div>
          <input className="form-input" type="number" min="1000" step="1000" value={amount} onChange={e => setAmount(e.target.value)} />
        </div>
        <div style={{ background: '#F7F6F3', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#5f5e5a', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <Clock size={14} style={{ marginTop: 2, flexShrink: 0, color: '#888' }} />
          In production this connects to your payment provider. For now, top-ups are applied immediately for testing.
        </div>
        {success && <div style={{ background: '#EAF3DE', color: '#3B6D11', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 12 }}>{success}</div>}
        <button className="btn-tlb" onClick={handleTopUp} disabled={loading || !amount || parseFloat(amount) < 1000}>
          <CreditCard size={14} />
          {loading ? 'Processing…' : `Add AED ${parseFloat(amount || '0').toLocaleString()}`}
        </button>
      </div>

      <div className="card">
        <h2 style={{ fontSize: 15, fontWeight: 500, margin: '0 0 12px' }}>How billing works</h2>
        {[
          { title: 'Pre-paid model', desc: 'Credits are deducted from your balance as employees redeem vouchers. Your program pauses automatically if balance runs out.' },
          { title: 'No PII in billing', desc: 'Invoices reference campaign IDs and aggregate totals only — no employee names or emails appear in any billing document.' },
          { title: 'Invoice generation', desc: 'Monthly invoices are emailed to your admin address automatically and available for download here.' },
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, paddingBottom: 12, marginBottom: 12, borderBottom: i < 2 ? '0.5px solid #f0efe7' : 'none' }}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#FF6B00', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 500, flexShrink: 0 }}>{i + 1}</div>
            <div>
              <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 2 }}>{item.title}</div>
              <div style={{ fontSize: 13, color: '#888' }}>{item.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
