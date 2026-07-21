'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const COUNTRIES = ['UAE', 'Kuwait', 'Bahrain', 'Iraq', 'Egypt']
const INDUSTRIES = ['Airlines & Aviation', 'Banking & Finance', 'Retail', 'Telecom', 'Healthcare', 'Real Estate', 'Technology', 'Government', 'Other']

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tcAccepted, setTcAccepted] = useState(false)
  const [form, setForm] = useState({
    companyName: '', tradeNumber: '', country: 'UAE', industry: '',
    adminName: '', adminEmail: '', password: '', confirmPassword: '',
  })

  function update(k: string, v: string) {
    setForm(f => ({ ...f, [k]: v }))
  }

  async function handleSubmit() {
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, tcAccepted }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Signup failed')
      setLoading(false)
      return
    }
    router.push('/dashboard/onboarding')
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F7F6F3', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 44, height: 44, background: '#FF6B00', borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: 22, margin: '0 auto 12px'
          }}>t</div>
          <h1 style={{ fontSize: 20, fontWeight: 500, margin: 0 }}>Create a partner account</h1>
          <p style={{ color: '#888', fontSize: 14, margin: '6px 0 0' }}>Set up employee benefits in minutes</p>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24, gap: 4 }}>
          {['Company details', 'Admin contact', 'Terms'].map((label, i) => {
            const n = i + 1
            const done = step > n
            const active = step === n
            return (
              <div key={label} style={{ display: 'flex', alignItems: 'center', flex: i < 2 ? 1 : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%', fontSize: 11, fontWeight: 500,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: done || active ? '#FF6B00' : '#e0dfd7',
                    color: done || active ? '#fff' : '#888',
                    outline: active ? '3px solid #FFD4B3' : 'none',
                  }}>{done ? '✓' : n}</div>
                  <span style={{ fontSize: 12, color: active ? '#FF6B00' : '#888', fontWeight: active ? 500 : 400 }}>{label}</span>
                </div>
                {i < 2 && <div style={{ flex: 1, height: 1, background: step > n ? '#FF6B00' : '#e0dfd7', margin: '0 8px' }} />}
              </div>
            )
          })}
        </div>

        <div className="card">
          {step === 1 && (
            <div>
              <div style={{ marginBottom: 14 }}>
                <label className="form-label">Company name</label>
                <input className="form-input" value={form.companyName} onChange={e => update('companyName', e.target.value)} placeholder="Emirates Group" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label className="form-label">Trade licence number</label>
                  <input className="form-input" value={form.tradeNumber} onChange={e => update('tradeNumber', e.target.value)} placeholder="CN-1234567" />
                </div>
                <div>
                  <label className="form-label">Country</label>
                  <select className="form-input" value={form.country} onChange={e => update('country', e.target.value)}>
                    {COUNTRIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label className="form-label">Industry</label>
                <select className="form-input" value={form.industry} onChange={e => update('industry', e.target.value)}>
                  <option value="">Select industry</option>
                  {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
                </select>
              </div>
              <button className="btn-tlb" onClick={() => setStep(2)}
                disabled={!form.companyName || !form.tradeNumber || !form.industry}
                style={{ width: '100%', justifyContent: 'center' }}>Continue</button>
            </div>
          )}

          {step === 2 && (
            <div>
              <div style={{ marginBottom: 14 }}>
                <label className="form-label">Your name</label>
                <input className="form-input" value={form.adminName} onChange={e => update('adminName', e.target.value)} placeholder="Sarah Al Rashidi" />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label className="form-label">Work email</label>
                <input className="form-input" type="email" value={form.adminEmail} onChange={e => update('adminEmail', e.target.value)} placeholder="sarah@emirates.com" />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label className="form-label">Password</label>
                <input className="form-input" type="password" value={form.password} onChange={e => update('password', e.target.value)} placeholder="Min. 8 characters" />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label className="form-label">Confirm password</label>
                <input className="form-input" type="password" value={form.confirmPassword} onChange={e => update('confirmPassword', e.target.value)} placeholder="Repeat password" />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-secondary" onClick={() => setStep(1)}>Back</button>
                <button className="btn-tlb" onClick={() => setStep(3)}
                  disabled={!form.adminName || !form.adminEmail || form.password.length < 8}
                  style={{ flex: 1, justifyContent: 'center' }}>Continue</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <div style={{ background: '#F7F6F3', borderRadius: 8, padding: 14, marginBottom: 16, maxHeight: 180, overflowY: 'auto', fontSize: 12, color: '#5f5e5a', lineHeight: 1.6 }}>
                <strong style={{ display: 'block', marginBottom: 6 }}>talabat for Business — Partner terms</strong>
                By creating an account you agree that: employee benefit credits are prepaid and non-refundable after activation; employee IDs are stored as one-way hashes and no personally identifiable information is shared with talabat; credits may only be used on the talabat platform in the agreed markets; talabat reserves the right to suspend accounts in breach of fair-use policies; billing cycles and invoicing terms are as agreed in your commercial contract.
              </div>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', marginBottom: 20 }}>
                <input type="checkbox" checked={tcAccepted} onChange={e => setTcAccepted(e.target.checked)}
                  style={{ marginTop: 2, accentColor: '#FF6B00' }} />
                <span style={{ fontSize: 13, color: '#5f5e5a' }}>
                  I accept the partner terms and confirm I am authorised to create this account on behalf of {form.companyName || 'my company'}.
                </span>
              </label>
              {error && <div style={{ color: '#A32D2D', fontSize: 13, marginBottom: 12, background: '#FCEBEB', padding: '8px 12px', borderRadius: 6 }}>{error}</div>}
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-secondary" onClick={() => setStep(2)}>Back</button>
                <button className="btn-tlb" onClick={handleSubmit} disabled={!tcAccepted || loading}
                  style={{ flex: 1, justifyContent: 'center' }}>
                  {loading ? 'Creating account…' : 'Create account'}
                </button>
              </div>
            </div>
          )}
        </div>
        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: '#888' }}>
          Already have an account? <Link href="/login" style={{ color: '#FF6B00' }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}
