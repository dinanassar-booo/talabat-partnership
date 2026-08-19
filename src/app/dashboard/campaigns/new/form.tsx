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
    cycleType: 'monthly',
    headcount: '',
    budgetTotal: '',
    minOrderValue: '30',
    validityDays: '7',
    startDate: new Date().toISOString().slice(0, 10),
    fundingModel: 'employer_funded',
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
      const multiplier: Record<string, number> = { weekly: 4, biweekly: 2, monthly: 1, quarterly: 0.33 }
      const auto = h * c * (multiplier[form.cycleType] || 1)
      setForm(f => ({ ...f, budgetTotal: Math.round(auto).toString() }))
    }
  }, [form.headcount, form.creditValue, form.cycleType])

  function update(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const res = await fetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Failed to create campaign'); setLoading(false); return }
    router.push('/dashboard/campaigns')
  }

  const multiplier: Record<string, number> = { weekly: 4, biweekly: 2, monthly: 1, quarterly: 0.33 }
  const estimatedMonthly = (parseInt(form.headcount) || 0) * (parseFloat(form.creditValue) || 0) * (multiplier[form.cycleType] || 1)

    const fundingLabels: Record<string, { label: string; desc: string; available: boolean }> = {
    employer_funded: { label: 'Employer funded', desc: 'Company covers 100% — employees receive the benefit at no cost', available: true },
    co_funded: { label: 'Co-funded', desc: 'Company subsidizes a portion — employees pay the remaining amount', available: false },
    employee_benefit: { label: 'Employee benefit', desc: 'Employees pay in full but at a negotiated corporate rate', available: false },
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Link href="/dashboard/campaigns" style={{ color: '#888', display: 'flex', alignItems: 'center' }}><ArrowLeft size={18} /></Link>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 500, margin: 0 }}>New campaign</h1>
          <p style={{ color: '#888', fontSize: 13, margin: '4px 0 0' }}>Configure a benefit for your employees.</p>
        </div>
      </div>
      <form onSubmit={handleSubmit}>

        {/* Benefit type */}
        <div className="card" style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 15, fontWeight: 500, margin: '0 0 16px' }}>Benefit type</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {benefits.map(b => {
  const isActive = b.slug === 'voucher_wallet'
  return (
    <div key={b.id}
      onClick={() => isActive && update('benefitTypeId', b.id)}
      style={{
        border: `${form.benefitTypeId === b.id ? '2px solid #FF6B00' : '0.5px solid #e0dfd7'}`,
        borderRadius: 10, padding: '12px 14px',
        cursor: isActive ? 'pointer' : 'not-allowed',
        background: form.benefitTypeId === b.id ? '#FFF8F4' : isActive ? '#fff' : '#F7F6F3',
        opacity: isActive ? 1 : 0.5,
        position: 'relative',
      }}>
      <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 3, color: isActive ? '#1a1a18' : '#888' }}>{b.name}</div>
      <div style={{ fontSize: 12, color: '#888' }}>{b.description}</div>
      {!isActive && (
        <span style={{ position: 'absolute', top: 10, right: 10, fontSize: 10, fontWeight: 600, background: '#e0dfd7', color: '#888', padding: '2px 8px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Coming soon
        </span>
      )}
    </div>
  )
})}
          </div>
        </div>

        {/* Funding model */}
        <div className="card" style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 15, fontWeight: 500, margin: '0 0 16px' }}>Funding model</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {Object.entries(fundingLabels).map(([value, { label, desc, available }]) => (
              <div key={value} onClick={() => available && update('fundingModel', value)}
                style={{ border: `${form.fundingModel === value ? '2px solid #FF6B00' : '0.5px solid #e0dfd7'}`, borderRadius: 10, padding: '12px 14px', cursor: available ? 'pointer' : 'not-allowed', background: form.fundingModel === value ? '#FFF8F4' : available ? '#fff' : '#F7F6F3', opacity: available ? 1 : 0.5, display: 'flex', alignItems: 'flex-start', gap: 10, position: 'relative' }}>
                {!available && <span style={{ position: 'absolute', top: 10, right: 10, fontSize: 10, fontWeight: 600, background: '#e0dfd7', color: '#888', padding: '2px 8px', borderRadius: 20, textTransform: 'uppercase' }}>Coming soon</span>}
                <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${form.fundingModel === value ? '#FF6B00' : '#d1d0c9'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2, flexShrink: 0 }}>
                  {form.fundingModel === value && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FF6B00' }} />}
                </div>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 12, color: '#888' }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Campaign details */}
        <div className="card" style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 15, fontWeight: 500, margin: '0 0 16px' }}>Campaign details</h2>
          <div style={{ marginBottom: 14 }}>
            <label className="form-label">Campaign name</label>
            <input className="form-input" value={form.name} onChange={e => update('name', e.target.value)} placeholder="Monthly meal allowance" required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div>
              <label className="form-label">Credit per employee (AED)</label>
              <input className="form-input" type="number" min="10" max="2000" value={form.creditValue} onChange={e => update('creditValue', e.target.value)} required />
            </div>
            <div>
              <label className="form-label">Min. order value (AED)</label>
              <input className="form-input" type="number" min="0" value={form.minOrderValue} onChange={e => update('minOrderValue', e.target.value)} required />
            </div>
            <div>
              <label className="form-label">Voucher validity (days)</label>
              <select className="form-input" value={form.validityDays} onChange={e => update('validityDays', e.target.value)}>
                <option value="3">3 days</option>
                <option value="5">5 days (Mon–Fri)</option>
                <option value="7">7 days</option>
                <option value="14">14 days</option>
                <option value="30">30 days</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div>
              <label className="form-label">Send cycle</label>
              <select className="form-input" value={form.cycleType} onChange={e => update('cycleType', e.target.value)}>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Every 2 weeks</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
              </select>
            </div>
            <div>
              <label className="form-label">Start date</label>
              <input className="form-input" type="date" value={form.startDate} min={new Date().toISOString().slice(0, 10)} onChange={e => update('startDate', e.target.value)} required />
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

        {/* Budget summary */}
        {estimatedMonthly > 0 && (
          <div className="card" style={{ marginBottom: 16, background: '#FFF8F4', border: '0.5px solid #FFB380' }}>
            <h2 style={{ fontSize: 15, fontWeight: 500, margin: '0 0 12px' }}>Budget summary</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, fontSize: 13 }}>
              <div>
                <div style={{ color: '#888', marginBottom: 2 }}>Est. monthly spend</div>
                <div style={{ fontSize: 18, fontWeight: 500, color: '#FF6B00' }}>AED {Math.round(estimatedMonthly).toLocaleString()}</div>
              </div>
              <div>
                <div style={{ color: '#888', marginBottom: 2 }}>Per employee / {form.cycleType}</div>
                <div style={{ fontSize: 18, fontWeight: 500 }}>AED {form.creditValue}</div>
              </div>
              <div>
                <div style={{ color: '#888', marginBottom: 2 }}>Voucher valid for</div>
                <div style={{ fontSize: 18, fontWeight: 500 }}>{form.validityDays} days</div>
              </div>
              <div>
                <div style={{ color: '#888', marginBottom: 2 }}>Funding</div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{fundingLabels[form.fundingModel]?.label}</div>
              </div>
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
