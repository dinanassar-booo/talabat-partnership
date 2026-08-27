'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

type BenefitType = { id: string; slug: string; name: string; description: string }

const STEPS = ['Choose benefit', 'Configure', 'Review']

export default function NewCampaignForm() {
  const router = useRouter()
  const params = useSearchParams()
  const [step, setStep] = useState(1)
  const [benefits, setBenefits] = useState<BenefitType[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    benefitTypeId: params.get('benefit') || '',
    benefitName: '',
    name: '',
    creditValue: '100',
    cycleType: 'monthly',
    headcount: '',
    budgetTotal: '',
    minOrderValue: '30',
    validityDays: '7',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: '',
    fundingModel: 'employer_funded',
  })

  useEffect(() => {
    fetch('/api/benefits').then(r => r.json()).then(d => {
      setBenefits(d.benefits || [])
      if (!form.benefitTypeId && d.benefits?.length) {
        const vw = d.benefits.find((b: BenefitType) => b.slug === 'voucher_wallet')
        if (vw) setForm(f => ({ ...f, benefitTypeId: vw.id, benefitName: vw.name }))
      }
    })
  }, [])

  useEffect(() => {
    const h = parseInt(form.headcount) || 0
    const c = parseFloat(form.creditValue) || 0
    if (h > 0 && c > 0) {
      const multiplier: Record<string, number> = { weekly: 4, biweekly: 2, monthly: 1, quarterly: 0.33 }
      setForm(f => ({ ...f, budgetTotal: Math.round(h * c * (multiplier[f.cycleType] || 1)).toString() }))
    }
  }, [form.headcount, form.creditValue, form.cycleType])

  function update(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSubmit() {
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
  const selectedBenefit = benefits.find(b => b.id === form.benefitTypeId)

  const cycleLabels: Record<string, string> = { weekly: 'Weekly', biweekly: 'Every 2 weeks', monthly: 'Monthly', quarterly: 'Quarterly' }
  const validityLabels: Record<string, string> = { '3': '3 days', '5': '5 days (Mon–Fri)', '7': '7 days', '14': '14 days', '30': '30 days' }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>

      {/* Step indicator */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 40 }}>
        {STEPS.map((s, i) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: i < step - 1 ? 'pointer' : 'default' }}
              onClick={() => { if (i < step - 1) setStep(i + 1) }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0,
                background: i + 1 < step ? '#FF6B00' : i + 1 === step ? '#1A1A18' : 'transparent',
                color: i + 1 <= step ? '#fff' : '#aaa',
                border: i + 1 > step ? '1.5px solid #e0dfd7' : 'none',
              }}>
                {i + 1 < step ? '✓' : i + 1}
              </div>
              <span style={{ fontSize: 13, fontWeight: i + 1 === step ? 600 : 400, color: i + 1 === step ? '#1A1A18' : i + 1 < step ? '#FF6B00' : '#aaa', whiteSpace: 'nowrap' }}>{s}</span>
            </div>
            {i < STEPS.length - 1 && <div style={{ flex: 1, height: 1, background: i + 1 < step ? '#FF6B00' : '#e0dfd7', margin: '0 12px' }} />}
          </div>
        ))}
      </div>

      {/* Step 1 — Choose benefit */}
      {step === 1 && (
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px' }}>Choose your benefit type</h1>
          <p style={{ color: '#888', fontSize: 14, margin: '0 0 28px', lineHeight: 1.6 }}>Select the benefit you want to offer your employees. You can set up more programs later.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
            {benefits.map(b => {
              const isAvailable = b.slug === 'voucher_wallet'
              const isSelected = form.benefitTypeId === b.id
              return (
                <div key={b.id}
                  onClick={() => isAvailable && setForm(f => ({ ...f, benefitTypeId: b.id, benefitName: b.name }))}
                  style={{ border: `${isSelected ? '2px solid #FF6B00' : '1.5px solid #e0dfd7'}`, borderRadius: 12, padding: '18px 20px', cursor: isAvailable ? 'pointer' : 'not-allowed', background: isSelected ? '#FFF8F4' : isAvailable ? '#fff' : '#F7F6F3', opacity: isAvailable ? 1 : 0.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4, color: isAvailable ? '#1a1a18' : '#888' }}>{b.name}</div>
                    <div style={{ fontSize: 13, color: '#888', lineHeight: 1.5 }}>{b.description}</div>
                  </div>
                  <div style={{ flexShrink: 0, marginLeft: 16 }}>
                    {!isAvailable ? (
                      <span style={{ fontSize: 11, fontWeight: 600, background: '#e0dfd7', color: '#888', padding: '3px 10px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Coming soon</span>
                    ) : (
                      <div style={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid ${isSelected ? '#FF6B00' : '#d1d0c9'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {isSelected && <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF6B00' }} />}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Link href="/dashboard/campaigns"><button style={{ background: 'transparent', border: '1.5px solid #e0dfd7', borderRadius: 8, padding: '11px 20px', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', color: '#5f5e5a' }}>Cancel</button></Link>
            <button onClick={() => setStep(2)} disabled={!form.benefitTypeId}
              style={{ background: !form.benefitTypeId ? '#ffb380' : '#FF6B00', color: '#fff', border: 'none', borderRadius: 8, padding: '11px 28px', fontSize: 14, fontWeight: 600, cursor: form.benefitTypeId ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
              Continue →
            </button>
          </div>
        </div>
      )}

      {/* Step 2 — Configure */}
      {step === 2 && (
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px' }}>Configure your program</h1>
          <p style={{ color: '#888', fontSize: 14, margin: '0 0 28px', lineHeight: 1.6 }}>Set the benefit value, schedule, and employee count for your {selectedBenefit?.name} program.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#1a1a18' }}>Program name</label>
              <input value={form.name} onChange={e => update('name', e.target.value)} placeholder="e.g. Monthly meal allowance"
                style={{ width: '100%', border: '1.5px solid #e0dfd7', borderRadius: 8, padding: '11px 14px', fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
              <p style={{ fontSize: 12, color: '#aaa', margin: '5px 0 0' }}>This name is visible only to you in the dashboard</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#1a1a18' }}>Credit per employee</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#888', fontWeight: 500 }}>AED</span>
                  <input type="number" min="10" max="2000" value={form.creditValue} onChange={e => update('creditValue', e.target.value)}
                    style={{ width: '100%', border: '1.5px solid #e0dfd7', borderRadius: 8, padding: '11px 14px 11px 48px', fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#1a1a18' }}>Min. order value</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#888', fontWeight: 500 }}>AED</span>
                  <input type="number" min="0" value={form.minOrderValue} onChange={e => update('minOrderValue', e.target.value)}
                    style={{ width: '100%', border: '1.5px solid #e0dfd7', borderRadius: 8, padding: '11px 14px 11px 48px', fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
                </div>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 10, color: '#1a1a18' }}>Send frequency</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {Object.entries(cycleLabels).map(([val, label]) => (
                  <div key={val} onClick={() => update('cycleType', val)}
                    style={{ border: `${form.cycleType === val ? '2px solid #FF6B00' : '1.5px solid #e0dfd7'}`, borderRadius: 8, padding: '10px 8px', cursor: 'pointer', textAlign: 'center', background: form.cycleType === val ? '#FFF8F4' : '#fff' }}>
                    <div style={{ fontSize: 13, fontWeight: form.cycleType === val ? 600 : 400, color: form.cycleType === val ? '#FF6B00' : '#1a1a18' }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 10, color: '#1a1a18' }}>Voucher validity</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                {Object.entries(validityLabels).map(([val, label]) => (
                  <div key={val} onClick={() => update('validityDays', val)}
                    style={{ border: `${form.validityDays === val ? '2px solid #FF6B00' : '1.5px solid #e0dfd7'}`, borderRadius: 8, padding: '10px 6px', cursor: 'pointer', textAlign: 'center', background: form.validityDays === val ? '#FFF8F4' : '#fff' }}>
                    <div style={{ fontSize: 12, fontWeight: form.validityDays === val ? 600 : 400, color: form.validityDays === val ? '#FF6B00' : '#1a1a18' }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#1a1a18' }}>Employee headcount</label>
                <input type="number" min="1" value={form.headcount} onChange={e => update('headcount', e.target.value)} placeholder="e.g. 500"
                  style={{ width: '100%', border: '1.5px solid #e0dfd7', borderRadius: 8, padding: '11px 14px', fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#1a1a18' }}>Start date</label>
                <input type="date" value={form.startDate} min={new Date().toISOString().slice(0, 10)} onChange={e => update('startDate', e.target.value)}
                  style={{ width: '100%', border: '1.5px solid #e0dfd7', borderRadius: 8, padding: '11px 14px', fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#1a1a18' }}>End date <span style={{ fontWeight: 400, color: '#aaa' }}>(optional)</span></label>
                <input type="date" value={form.endDate} min={form.startDate} onChange={e => update('endDate', e.target.value)}
                  style={{ width: '100%', border: '1.5px solid #e0dfd7', borderRadius: 8, padding: '11px 14px', fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
              </div>
            </div>

            {estimatedMonthly > 0 && (
              <div style={{ background: '#FFF8F4', border: '1.5px solid #FFB380', borderRadius: 12, padding: '16px 20px' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#FF6B00', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Budget estimate</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#888', marginBottom: 3 }}>Monthly spend</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#FF6B00' }}>AED {Math.round(estimatedMonthly).toLocaleString()}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#888', marginBottom: 3 }}>Per employee</div>
                    <div style={{ fontSize: 20, fontWeight: 700 }}>AED {form.creditValue}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#888', marginBottom: 3 }}>Valid for</div>
                    <div style={{ fontSize: 20, fontWeight: 700 }}>{validityLabels[form.validityDays]}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32 }}>
            <button onClick={() => setStep(1)}
              style={{ background: 'transparent', border: '1.5px solid #e0dfd7', borderRadius: 8, padding: '11px 20px', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', color: '#5f5e5a' }}>← Back</button>
            <button onClick={() => setStep(3)} disabled={!form.name || !form.headcount}
              style={{ background: !form.name || !form.headcount ? '#ffb380' : '#FF6B00', color: '#fff', border: 'none', borderRadius: 8, padding: '11px 28px', fontSize: 14, fontWeight: 600, cursor: form.name && form.headcount ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
              Review →
            </button>
          </div>
        </div>
      )}

      {/* Step 3 — Review */}
      {step === 3 && (
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px' }}>Review your program</h1>
          <p style={{ color: '#888', fontSize: 14, margin: '0 0 28px', lineHeight: 1.6 }}>Double-check your settings before creating the campaign. You can edit these later.</p>

          <div style={{ background: '#fff', border: '1.5px solid #e0dfd7', borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
            <div style={{ background: '#FF6B00', padding: '14px 20px' }}>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Campaign</div>
              <div style={{ color: '#fff', fontSize: 18, fontWeight: 700 }}>{form.name}</div>
            </div>
            {[
              { label: 'Benefit type', value: selectedBenefit?.name || '—' },
              { label: 'Credit per employee', value: `AED ${form.creditValue}` },
              { label: 'Min. order value', value: `AED ${form.minOrderValue}` },
              { label: 'Send frequency', value: cycleLabels[form.cycleType] },
              { label: 'Voucher validity', value: validityLabels[form.validityDays] },
              { label: 'Employee headcount', value: Number(form.headcount).toLocaleString() },
              { label: 'Start date', value: new Date(form.startDate).toLocaleDateString('en-AE', { day: 'numeric', month: 'long', year: 'numeric' }) },
              { label: 'End date', value: form.endDate ? new Date(form.endDate).toLocaleDateString('en-AE', { day: 'numeric', month: 'long', year: 'numeric' }) : 'No end date' },
              { label: 'Estimated monthly budget', value: estimatedMonthly > 0 ? `AED ${Math.round(estimatedMonthly).toLocaleString()}` : '—', highlight: true },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '13px 20px', borderBottom: '1px solid #F0EFE9' }}>
                <span style={{ fontSize: 13, color: '#888' }}>{r.label}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: r.highlight ? '#FF6B00' : '#1a1a18' }}>{r.value}</span>
              </div>
            ))}
          </div>

          {error && <div style={{ background: '#FCEBEB', color: '#A32D2D', padding: '12px 16px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{error}</div>}

          <div style={{ background: '#F7F6F3', border: '1px solid #e0dfd7', borderRadius: 10, padding: '14px 18px', marginBottom: 24, fontSize: 13, color: '#5f5e5a', lineHeight: 1.6 }}>
            After creating the campaign, generate your benefit codes from the Codes tab and launch when ready.
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button onClick={() => setStep(2)}
              style={{ background: 'transparent', border: '1.5px solid #e0dfd7', borderRadius: 8, padding: '11px 20px', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', color: '#5f5e5a' }}>← Back</button>
            <button onClick={handleSubmit} disabled={loading}
              style={{ background: loading ? '#ffb380' : '#FF6B00', color: '#fff', border: 'none', borderRadius: 8, padding: '11px 28px', fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
              {loading ? 'Creating...' : 'Create campaign ✓'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
