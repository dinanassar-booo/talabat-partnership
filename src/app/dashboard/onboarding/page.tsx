import { getSession } from '@/lib/auth'
import { db, employees, campaigns, budgetAccounts } from '@/db'
import { eq, and, count } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { CheckCircle, Circle } from 'lucide-react'
import Link from 'next/link'

export default async function OnboardingPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const [[{ empCount }], [{ campCount }], budget] = await Promise.all([
    db.select({ empCount: count() }).from(employees).where(and(eq(employees.partnerId, session.id), eq(employees.status, 'active'))),
    db.select({ campCount: count() }).from(campaigns).where(eq(campaigns.partnerId, session.id)),
    db.select().from(budgetAccounts).where(eq(budgetAccounts.partnerId, session.id)).get(),
  ])

  const steps = [
    { label: 'Create account', done: true, href: null, desc: 'Account created and terms accepted.' },
    { label: 'Upload employee list', done: empCount > 0, href: '/dashboard/employees', desc: empCount > 0 ? `${empCount.toLocaleString()} employees active.` : 'Upload a CSV with employee IDs — no emails needed.' },
    { label: 'Configure a benefit', done: campCount > 0, href: '/dashboard/benefits', desc: campCount > 0 ? `${campCount} campaign${campCount > 1 ? 's' : ''} configured.` : 'Choose from voucher wallet, TPro, dine-out, and more.' },
    { label: 'Add budget', done: (budget?.balance ?? 0) > 0, href: '/dashboard/billing', desc: (budget?.balance ?? 0) > 0 ? `AED ${Math.round(budget!.balance).toLocaleString()} balance.` : 'Top up your account to fund employee credits.' },
    { label: 'Go live', done: session.status === 'active', href: null, desc: session.status === 'active' ? 'Your program is live.' : 'Completes automatically once steps 2–4 are done.' },
  ]
  const completed = steps.filter(s => s.done).length
  const allDone = completed === steps.length

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 500, margin: 0 }}>Onboarding</h1>
        <p style={{ color: '#888', fontSize: 13, margin: '4px 0 0' }}>{allDone ? 'Setup complete — your program is live.' : `${completed} of ${steps.length} steps done`}</p>
      </div>
      <div style={{ background: '#e0dfd7', borderRadius: 4, height: 6, marginBottom: 28 }}>
        <div style={{ background: '#FF6B00', height: '100%', borderRadius: 4, width: `${(completed / steps.length) * 100}%` }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {steps.map((step, i) => (
          <div key={step.label} className="card" style={{ display: 'flex', alignItems: 'flex-start', gap: 14, opacity: (!step.done && i > 0 && !steps[i-1].done) ? 0.5 : 1 }}>
            <div style={{ marginTop: 2 }}>
              {step.done ? <CheckCircle size={20} color="#3B6D11" /> : <Circle size={20} color="#d1d0c9" />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500, fontSize: 14, color: step.done ? '#3B6D11' : '#1a1a18', marginBottom: 2 }}>{step.label}</div>
              <div style={{ fontSize: 13, color: '#888' }}>{step.desc}</div>
            </div>
            {step.href && !step.done && <Link href={step.href}><button className="btn-tlb" style={{ fontSize: 12, padding: '6px 14px' }}>Start →</button></Link>}
            {step.href && step.done && <Link href={step.href}><button className="btn-secondary" style={{ fontSize: 12, padding: '6px 14px' }}>Edit</button></Link>}
          </div>
        ))}
      </div>
      {allDone && (
        <div style={{ marginTop: 20, background: '#EAF3DE', borderRadius: 12, padding: '16px 20px', display: 'flex', gap: 12 }}>
          <CheckCircle size={20} color="#3B6D11" style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <div style={{ fontWeight: 500, color: '#3B6D11', marginBottom: 4 }}>Program is live</div>
            <div style={{ fontSize: 13, color: '#3B6D11' }}>Employees receive benefits automatically. Monitor performance on your dashboard.</div>
          </div>
        </div>
      )}
    </div>
  )
}
