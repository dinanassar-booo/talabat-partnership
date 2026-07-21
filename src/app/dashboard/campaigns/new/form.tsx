'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

type BenefitType = { id: string; slug: string; name: string; description: string }

export default function NewCampaignForm() {
  const router = useRouter()
  const params = useSearchParams()
  const [benefits, setBenefits] = useState<BenefitType[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    benefitTypeId: params.get('benefit') || '',
    name: '',
    creditValue: '100',
    cycleType: 'weekly',
    headcount: '',
    budgetTotal: '',
  })

  useEffect(() => {
    fetch('/api/benefits').then(r => r.json()).then(d => {
      setBenefits(d.benefits || [])
      if (!form.benefitTypeId && d.benefits?.length) setForm(f => ({ ...f, benefitTypeId: d.benefits[0].id }))
    })
  }, [])

  useEffect(() => {
    const h = parseInt(form.headcount) || 0
    const c = parseFloat(form.creditValue) || 0
    if (h > 0 && c > 0) {
      const auto = form.cycleType === 'weekly' ? h * c * 4 : h * c
      setForm(f => ({ ...f, budgetTotal: Math.round(auto).toString() }))
    }
  }, [form.headcount, form.creditValue, form.cycleType])

  function update(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const res = await fetch('/api/campaigns', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Failed to create campaign'); setLoading(false); return }
    router.push('/dashboard/campaigns')
  }

  const estimatedMonthly = (parseInt(form.headcount) || 0) * (parseFloat(form.creditValue) || 0) * (form.cycleType === 'weekly' ? 4 : 1)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Link href="/dashboard/benefits" style={{ color: '#888', display: 'flex', alignItems: 'center' }}><ArrowLeft size={18} /></Link>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 500, margin: 0 }}>New campaign</h1>
          <p style={{ color: '#888', fontSize: 13, margin: '4px 0 0' }}>Configure a benefit for your employees.</p>
        </div>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="card" style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 15, fontWeight: 500, margin: '0 0 16px' }}>Benefit type</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {benefits.map(b => (
              <div key={b.id} onClick={() => update('benefitTypeId', b.id)}
                style={{ border: `${form.benefitTypeId === b.id ? '2px solid #FF6B00' : '0.5px solid #e0dfd7'}`, borderRadius: 10, padding: '12px 14px', cursor: 'pointer', background: form.benefitTypeId === b.id ? '#FFF8F4' : '#fff' }}>
                <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 3 }}>{b.name}</div>
                <div style={{ fontSize: 12, color: '#888' }}>{b.description}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="card" style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 15, fontWeight: 500, margin: '0 0 16px' }}>Campaign details</h2>
          <div style={{ marginBottom: 14 }}>
            <label className="form-label">Campaign name</label>
            <input className="form-input" value={form.name} onChange={e => update('name', e.target.value)} placeholder="Weekly meal allowance" required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div>
              <label className="form-label">Credit per employee (AED)</label>
              <input className="form-input" type="number" min="10" max="2000" value={form.creditValue} onChange={e => update('creditValue', e.target.value)} required />
            </div>
            <div>
              <label className="form-label">Cycle</label>
              <select className="form-input" value={form.cycleType} onChange={e => update('cycleType', e.target.value)}>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="one_time">One-time</option>
              </select>
            </div>
            <div>
              <label className="form-label">Employee headcount</label>
              <input className="form-input" type="number" min="1" value={form.headcount} onChange={e => update('headcount', e.target.value)} placeholder="2847" required />
            </div>
          </div>
          <div>
            <label className="form-label">Total budget (AED)</label>
            <input className="form-input" type="number" min="1" value={form.budgetTotal} onChange={e => update('budgetTotal', e.target.value)} required />
            <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>Auto-calculated. Adjust as needed.</div>
          </div>
        </div>
        {estimatedMonthly > 0 && (
          <div className="card" style={{ marginBottom: 16, background: '#FFF8F4', border: '0.5px solid #FFB380' }}>
            <h2 style={{ fontSize: 15, fontWeight: 500, margin: '0 0 12px' }}>Budget summary</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
              <div><div style={{ color: '#888', marginBottom: 2 }}>Est. monthly spend</div><div style={{ fontSize: 18, fontWeight: 500, color: '#FF6B00' }}>AED {Math.round(estimatedMonthly).toLocaleString()}</div></div>
              <div><div style={{ color: '#888', marginBottom: 2 }}>Per employee / {form.cycleType.replace('_',' ')}</div><div style={{ fontSize: 18, fontWeight: 500 }}>AED {form.creditValue}</div></div>
            </div>
          </div>
        )}
        {error && <div style={{ color: '#A32D2D', background: '#FCEBEB', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>{error}</div>}
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="submit" className="btn-tlb" disabled={loading || !form.name || !form.headcount}>
            {loading ? 'Creating…' : 'Create campaign'}
          </button>
          <Link href="/dashboard/campaigns"><button type="button" className="btn-secondary">Cancel</button></Link>
        </div>
      </form>
    </div>
  )
}
