'use client'
import { useState } from 'react'

export default function RedeemPage() {
  const [code, setCode] = useState('')
  const [talabatEmail, setTalabatEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<{ creditValue: number; partnerName: string } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim().toUpperCase(), talabatEmail }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Something went wrong'); setLoading(false); return }
      setSuccess({ creditValue: data.creditValue, partnerName: data.partnerName })
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div style={{ minHeight: '100vh', background: '#F7F6F3', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ width: '100%', maxWidth: 420, textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, background: '#EDF7E6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 32 }}>🎉</div>
          <h1 style={{ fontSize: 24, fontWeight: 600, margin: '0 0 12px' }}>Voucher activated!</h1>
          <div style={{ background: '#fff', border: '0.5px solid #e0dfd7', borderRadius: 12, padding: '20px 24px', margin: '20px 0', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 14 }}>
              <span style={{ color: '#888' }}>Voucher value</span>
              <span style={{ fontWeight: 600, color: '#FF6B00', fontSize: 18 }}>AED {success.creditValue}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <span style={{ color: '#888' }}>From</span>
              <span style={{ fontWeight: 500 }}>{success.partnerName}</span>
            </div>
          </div>
          <p style={{ color: '#5f5e5a', fontSize: 14, lineHeight: 1.6, margin: '0 0 24px' }}>
            Your voucher will appear in your talabat wallet within a few minutes. Open the talabat app to use it on your next order.
          </p>
          <a href="talabat://" style={{ display: 'inline-block', background: '#FF6B00', color: '#fff', textDecoration: 'none', padding: '14px 32px', borderRadius: 10, fontSize: 15, fontWeight: 600 }}>
            Open talabat app →
          </a>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F7F6F3', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <div style={{ width: 44, height: 44, background: '#FF6B00', borderRadius: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 22, marginBottom: 14 }}>t</div>
        <h1 style={{ fontSize: 22, fontWeight: 500, margin: '0 0 6px' }}>Redeem your benefit</h1>
        <p style={{ color: '#888', fontSize: 14, margin: 0 }}>Enter your code to activate your talabat voucher</p>
      </div>

      <div style={{ width: '100%', maxWidth: 420, background: '#fff', borderRadius: 12, border: '0.5px solid #e0dfd7', padding: 28 }}>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#5f5e5a', marginBottom: 5 }}>
              Benefit code
            </label>
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              placeholder="TLB-AE-VW-XXXXXXXX-XX"
              required
              style={{ width: '100%', border: '0.5px solid #e0dfd7', borderRadius: 8, padding: '10px 12px', fontSize: 13, outline: 'none', fontFamily: 'monospace', letterSpacing: '0.05em' }}
            />
            <p style={{ fontSize: 11, color: '#aaa', margin: '5px 0 0' }}>The code you received from your employer</p>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#5f5e5a', marginBottom: 5 }}>
              Your talabat email address
            </label>
            <input
              type="email"
              value={talabatEmail}
              onChange={e => setTalabatEmail(e.target.value)}
              placeholder="you@email.com"
              required
              style={{ width: '100%', border: '0.5px solid #e0dfd7', borderRadius: 8, padding: '10px 12px', fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
            />
            <p style={{ fontSize: 11, color: '#aaa', margin: '5px 0 0' }}>The email address linked to your talabat account</p>
          </div>

          {error && (
            <div style={{ background: '#FCEBEB', color: '#A32D2D', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !code || !talabatEmail}
            style={{
              width: '100%',
              background: loading || !code || !talabatEmail ? '#ffb380' : '#FF6B00',
              color: '#fff', border: 'none', borderRadius: 8, padding: '12px',
              fontSize: 14, fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit'
            }}
          >
            {loading ? 'Activating voucher…' : 'Activate my voucher →'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 12, color: '#aaa', marginTop: 16, lineHeight: 1.5 }}>
          Make sure you enter the email address registered<br />on your talabat account.
        </p>
      </div>
    </div>
  )
}
