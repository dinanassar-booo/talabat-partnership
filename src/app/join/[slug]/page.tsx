'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

type PartnerInfo = { companyName: string; slug: string }

export default function JoinPage() {
  const { slug } = useParams()
  const [partner, setPartner] = useState<PartnerInfo | null>(null)
  const [employeeId, setEmployeeId] = useState('')
  const [companyEmail, setCompanyEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    fetch(`/api/join/info?slug=${slug}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setNotFound(true)
        else setPartner(d)
      })
      .catch(() => setNotFound(true))
  }, [slug])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, employeeId, companyEmail }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Something went wrong'); setLoading(false); return }
      setSuccess(true)
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  if (notFound) {
    return (
      <div style={{ minHeight: '100vh', background: '#F7F6F3', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
          <h1 style={{ fontSize: 20, fontWeight: 500, margin: '0 0 8px' }}>Company not found</h1>
          <p style={{ color: '#888', fontSize: 14 }}>Please check the link you received and try again.</p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div style={{ minHeight: '100vh', background: '#F7F6F3', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ width: '100%', maxWidth: 420, textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, background: '#EDF7E6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 28 }}>✓</div>
          <h1 style={{ fontSize: 22, fontWeight: 500, margin: '0 0 12px' }}>Check your email</h1>
          <p style={{ color: '#5f5e5a', fontSize: 14, lineHeight: 1.6, margin: '0 0 8px' }}>
            We've sent your benefit code and redemption link to <strong>{companyEmail}</strong>
          </p>
          <p style={{ color: '#888', fontSize: 13, lineHeight: 1.6 }}>
            Open the email, copy your code, and tap the link to claim your {partner?.companyName} benefit.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F7F6F3', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <div style={{ width: 44, height: 44, background: '#FF6B00', borderRadius: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 22, marginBottom: 14 }}>t</div>
        {partner ? (
          <>
            <h1 style={{ fontSize: 22, fontWeight: 500, margin: '0 0 6px' }}>{partner.companyName} employee benefit</h1>
            <p style={{ color: '#888', fontSize: 14, margin: 0 }}>{partner.companyName} has activated a talabat benefit for you</p>
          </>
        ) : (
          <>
            <h1 style={{ fontSize: 22, fontWeight: 500, margin: '0 0 6px' }}>Claim your employee benefit</h1>
            <p style={{ color: '#888', fontSize: 14, margin: 0 }}>Loading…</p>
          </>
        )}
      </div>

      <div style={{ width: '100%', maxWidth: 420, background: '#fff', borderRadius: 12, border: '0.5px solid #e0dfd7', padding: 28 }}>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#5f5e5a', marginBottom: 5 }}>Employee ID</label>
            <input
              type="text"
              value={employeeId}
              onChange={e => setEmployeeId(e.target.value)}
              placeholder="Your staff or employee number"
              required
              style={{ width: '100%', border: '0.5px solid #e0dfd7', borderRadius: 8, padding: '10px 12px', fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
            />
            <p style={{ fontSize: 11, color: '#aaa', margin: '5px 0 0' }}>Your company-assigned employee or staff number</p>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#5f5e5a', marginBottom: 5 }}>Company email address</label>
            <input
              type="email"
              value={companyEmail}
              onChange={e => setCompanyEmail(e.target.value)}
              placeholder="you@yourcompany.com"
              required
              style={{ width: '100%', border: '0.5px solid #e0dfd7', borderRadius: 8, padding: '10px 12px', fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
            />
            <p style={{ fontSize: 11, color: '#aaa', margin: '5px 0 0' }}>Must be your official company email address</p>
          </div>

          {error && (
            <div style={{ background: '#FCEBEB', color: '#A32D2D', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !employeeId || !companyEmail || !partner}
            style={{ width: '100%', background: loading || !employeeId || !companyEmail ? '#ffb380' : '#FF6B00', color: '#fff', border: 'none', borderRadius: 8, padding: '12px', fontSize: 14, fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
          >
            {loading ? 'Processing…' : `Claim my ${partner?.companyName || ''} benefit →`}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 12, color: '#aaa', marginTop: 16, lineHeight: 1.5 }}>
          Your employee ID is used to verify eligibility only.<br />
          It is stored as a one-way hash and never shared.
        </p>
      </div>
    </div>
  )
}
