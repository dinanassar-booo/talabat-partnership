import { getSession } from '@/lib/auth'
import { getDb } from '@/db'
import { redirect } from 'next/navigation'
import { CheckCircle, Circle } from 'lucide-react'
import Link from 'next/link'

export default async function OnboardingPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  const sql = getDb()
  const [empCount, campCount, budget] = await Promise.all([
    sql`SELECT COUNT(*) as cnt FROM employees WHERE partner_id = ${session.id} AND status = 'active'`,
    sql`SELECT COUNT(*) as cnt FROM campaigns WHERE partner_id = ${session.id}`,
    sql`SELECT balance FROM budget_accounts WHERE partner_id = ${session.id} LIMIT 1`,
  ])
  const ec = Number(empCount[0].cnt), cc = Number(campCount[0].cnt), bal = Number(budget[0]?.balance ?? 0)
  const steps = [
    { label: 'Create account', done: true, href: null, desc: 'Account created and terms accepted.' },
    { label: 'Configure a benefit', done: cc > 0, href: '/dashboard/benefits', desc: cc > 0 ? `${cc} campaign${cc > 1 ? 's' : ''} configured.` : 'Choose from voucher wallet, TPro, dine-out, and more.' },
    { label: 'Add budget', done: bal > 0, href: '/dashboard/billing', desc: bal > 0 ? `AED ${Math.round(bal).toLocaleString()} balance.` : 'Top up your account to fund employee credits.' },
    { label: 'Go live', done: session.status === 'active', href: null, desc: session.status === 'active' ? 'Your program is live.' : 'Completes automatically once steps 2–4 are done.' },
  ]
  const completed = steps.filter(s => s.done).length
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 500, margin: 0 }}>Onboarding</h1>
        <p style={{ color: '#888', fontSize: 13, margin: '4px 0 0' }}>{completed} of {steps.length} steps done</p>
      </div>
      <div style={{ background: '#e0dfd7', borderRadius: 4, height: 6, marginBottom: 28 }}>
        <div style={{ background: '#FF6B00', height: '100%', borderRadius: 4, width: `${(completed / steps.length) * 100}%` }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {steps.map((step, i) => (
          <div key={step.label} className="card" style={{ display: 'flex', alignItems: 'flex-start', gap: 14, opacity: (!step.done && i > 0 && !steps[i-1].done) ? 0.5 : 1 }}>
            <div style={{ marginTop: 2 }}>{step.done ? <CheckCircle size={20} color="#3B6D11" /> : <Circle size={20} color="#d1d0c9" />}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500, fontSize: 14, color: step.done ? '#3B6D11' : '#1a1a18', marginBottom: 2 }}>{step.label}</div>
              <div style={{ fontSize: 13, color: '#888' }}>{step.desc}</div>
            </div>
            {step.href && !step.done && <Link href={step.href}><button className="btn-tlb" style={{ fontSize: 12, padding: '6px 14px' }}>Start →</button></Link>}
            {step.href && step.done && <Link href={step.href}><button className="btn-secondary" style={{ fontSize: 12, padding: '6px 14px' }}>Edit</button></Link>}
          </div>
        ))}
      </div>
    </div>
  )
}
