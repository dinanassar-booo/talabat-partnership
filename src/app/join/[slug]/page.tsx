'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

type PartnerInfo = { companyName: string; slug: string }

export default function JoinPage() {
  const { slug } = useParams()
  const [partner, setPartner] = useState<PartnerInfo | null>(null)
  const [allPartners, setAllPartners] = useState<PartnerInfo[]>([])
  const [employeeId, setEmployeeId] = useState('')
  const [companyEmail, setCompanyEmail] = useState('')
  const [selectedSlug, setSelectedSlug] = useState(slug as string)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    // Load this partner
    fetch(`/api/join/info?slug=${slug}`)
      .then(r => r.json())
      .then(d => { if (d.error) setNotFound(true); else setPartner(d) })
      .catch(() => setNotFound(true))

    // Load all partners for dropdown
    fetch('/api/join/partners')
      .then(r => r.json())
      .then(d => setAllPartners(d.partners || []))
      .catch(() => {})
  }, [slug])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: selectedSlug, employeeId, companyEmail }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Something went wrong'); setLoading(false); return }
      setSuccess(true)
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  if (notFound) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F7F6F3' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
        <h1 style={{ fontSize: 20, fontWeight: 500, margin: '0 0 8px' }}>Company not found</h1>
        <p style={{ color: '#888', fontSize: 14 }}>Please check the link you received and try again.</p>
      </div>
    </div>
  )

  if (success) return (
    <div style={{ minHeight: '100vh', background: '#F7F6F3' }}>
      {/* Header */}
      <header style={{ background: '#FF6B00', padding: '14px 32px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ color: '#fff', fontWeight: 700, fontSize: 20, letterSpacing: '-0.5px' }}>talabat</div>
        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.4)' }} />
        <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14 }}>for Business</div>
      </header>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 54px)', padding: 24 }}>
        <div style={{ width: '100%', maxWidth: 480, textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, background: '#EDF7E6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 32 }}>✓</div>
          <h1 style={{ fontSize: 24, fontWeight: 600, margin: '0 0 12px' }}>You're enrolled!</h1>
          <p style={{ color: '#5f5e5a', fontSize: 15, lineHeight: 1.7, margin: '0 0 8px' }}>
            We've sent your benefit code to <strong>{companyEmail}</strong>
          </p>
          <p style={{ color: '#888', fontSize: 13, lineHeight: 1.6, margin: '0 0 28px' }}>
            Open the email from talabat, copy your unique code, and tap the button in the email to activate your benefit in the talabat app.
          </p>
          <div style={{ background: '#FFF8F4', border: '0.5px solid #FFB380', borderRadius: 12, padding: '20px 24px', textAlign: 'left' }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: '#FF6B00' }}>What happens next?</div>
            {[
              'Check your work email for a message from talabat',
              'Copy your unique benefit code from the email',
              'Tap the button in the email to open the talabat app',
              'Paste your code to activate your voucher',
              'Your benefit will appear in your talabat wallet'
            ].map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 10, alignItems: 'flex-start' }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#FF6B00', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                <div style={{ fontSize: 13, color: '#5f5e5a', paddingTop: 2, lineHeight: 1.5 }}>{step}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  const companyName = partner?.companyName || '…'

  return (
    <div style={{ minHeight: '100vh', background: '#F7F6F3' }}>
      {/* Header */}
      <header style={{ background: '#FF6B00', padding: '14px 32px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ color: '#fff', fontWeight: 700, fontSize: 20, letterSpacing: '-0.5px' }}>talabat</div>
        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.4)' }} />
        <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14 }}>for Business</div>
      </header>

      {/* Main content */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 24px', display: 'grid', gridTemplateColumns: '1fr 420px', gap: 64, alignItems: 'start' }}>

        {/* Left — benefit info */}
        <div>
          <div style={{ fontSize: 13, color: '#FF6B00', fontWeight: 600, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Corporate benefit</div>
          <h1 style={{ fontSize: 32, fontWeight: 700, margin: '0 0 16px', lineHeight: 1.25, color: '#1A1A18' }}>
            Your employer benefit<br />from {companyName} is ready
          </h1>
          <p style={{ fontSize: 15, color: '#5f5e5a', lineHeight: 1.7, margin: '0 0 36px', maxWidth: 480 }}>
            {companyName} has partnered with talabat to give you exclusive food benefits. Sign up below with your work details to receive your personal benefit code.
          </p>

          {/* Don't have talabat account */}
          <div style={{ background: '#fff', border: '0.5px solid #e0dfd7', borderRadius: 12, padding: '20px 24px', marginBottom: 32 }}>
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 8 }}>Don't have a talabat account yet?</div>
            <p style={{ fontSize: 13, color: '#5f5e5a', lineHeight: 1.6, margin: 0 }}>
              No worries — you can sign up on the talabat app. Once you've created an account, come back and complete this form. You'll receive your benefit code by email.
            </p>
          </div>

          {/* How it works */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 16 }}>How to claim your benefit</div>
            {[
              { title: 'Sign up below', desc: 'Enter your work email and employee ID to verify your eligibility.' },
              { title: 'Check your email', desc: 'You'll receive a unique benefit code on your work email.' },
              { title: 'Open the talabat app', desc: 'Use the link in your email to open talabat and paste your code.' },
              { title: 'Enjoy your benefit', desc: 'Your voucher will be added to your talabat wallet instantly.' },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 16, marginBottom: 20, alignItems: 'flex-start' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#FF6B00', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 3 }}>{s.title}</div>
                  <div style={{ fontSize: 13, color: '#5f5e5a', lineHeight: 1.5 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Important notes */}
          <div style={{ background: '#F7F6F3', borderRadius: 10, padding: '16px 20px' }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>Before you enroll, please note:</div>
            {[
              'Make sure your employee ID is correct — it will be verified against your company records.',
              'Use your company email address — this is how we verify your employment.',
              'You must have a talabat account to receive the benefit.',
              'Benefits are issued only after successful enrollment.',
            ].map((note, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, fontSize: 13, color: '#5f5e5a', alignItems: 'flex-start' }}>
                <span style={{ color: '#FF6B00', fontWeight: 700, flexShrink: 0 }}>·</span>
                <span style={{ lineHeight: 1.5 }}>{note}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right — form */}
        <div style={{ position: 'sticky', top: 24 }}>
          <div style={{ background: '#fff', borderRadius: 16, border: '0.5px solid #e0dfd7', padding: 28, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>

            {/* Company logo placeholder */}
            <div style={{ textAlign: 'center', marginBottom: 20, paddingBottom: 20, borderBottom: '0.5px solid #e0dfd7' }}>
              <div style={{ width: 56, height: 56, background: '#FFF8F4', borderRadius: 12, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8, fontSize: 22 }}>🏢</div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{companyName}</div>
              <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>Corporate benefit program</div>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Company dropdown */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#5f5e5a', marginBottom: 5 }}>Company</label>
                <select
                  value={selectedSlug}
                  onChange={e => setSelectedSlug(e.target.value)}
                  required
                  style={{ width: '100%', border: '0.5px solid #e0dfd7', borderRadius: 8, padding: '10px 12px', fontSize: 13, outline: 'none', fontFamily: 'inherit', background: '#fff', color: '#1a1a18' }}
                >
                  <option value="">Select your company</option>
                  {allPartners.map(p => (
                    <option key={p.slug} value={p.slug}>{p.companyName}</option>
                  ))}
                </select>
              </div>

              {/* Employee ID */}
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

              {/* Email */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#5f5e5a', marginBottom: 5 }}>Work email address</label>
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
                disabled={loading || !employeeId || !companyEmail || !selectedSlug}
                style={{ width: '100%', background: loading || !employeeId || !companyEmail || !selectedSlug ? '#ffb380' : '#FF6B00', color: '#fff', border: 'none', borderRadius: 8, padding: '13px', fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
              >
                {loading ? 'Processing…' : 'Enroll now →'}
              </button>

              <p style={{ textAlign: 'center', fontSize: 11, color: '#aaa', marginTop: 14, lineHeight: 1.5 }}>
                By signing up, you agree to our <span style={{ color: '#888', textDecoration: 'underline', cursor: 'pointer' }}>terms and conditions</span>.<br />
                Your employee ID is stored as a one-way hash and never shared.
              </p>
            </form>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ background: '#1A1A18', padding: '24px 32px', marginTop: 48 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>talabat</div>
          <div style={{ fontSize: 12, color: '#888' }}>© 2026 talabat. All rights reserved.</div>
        </div>
      </footer>
    </div>
  )
}
