'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Users, Gift, BarChart2,
  ClipboardList, CreditCard, LogOut, Bell, Settings
} from 'lucide-react'

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, section: 'main' },
  { label: 'Employees', href: '/dashboard/employees', icon: Users, section: 'main' },
  { label: 'Benefits catalog', href: '/dashboard/benefits', icon: Gift, section: 'main' },
  { label: 'Campaigns', href: '/dashboard/campaigns', icon: BarChart2, section: 'main' },
  { label: 'Onboarding', href: '/dashboard/onboarding', icon: ClipboardList, section: 'setup' },
  { label: 'Billing', href: '/dashboard/billing', icon: CreditCard, section: 'setup' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
const router = useRouter()
const [companyName, setCompanyName] = useState('...')
useEffect(() => {
  fetch('/api/auth/me').then(r => r.json()).then(d => { if (d.companyName) setCompanyName(d.companyName) })
}, [])
const [companyName, setCompanyName] = useState('...')
useEffect(() => {
  fetch('/api/auth/me').then(r => r.json()).then(d => { if (d.companyName) setCompanyName(d.companyName) })
}, [])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Top bar */}
      <header style={{
        height: 54, display: 'flex', alignItems: 'center', gap: 12,
        padding: '0 24px', background: '#fff', borderBottom: '0.5px solid #e0dfd7',
        position: 'sticky', top: 0, zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{
            width: 30, height: 30, background: '#FF6B00', borderRadius: 7,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: 15
          }}>t</div>
          <span style={{ fontWeight: 500, fontSize: 15 }}>talabat</span>
          <span style={{ color: '#888', fontWeight: 400, fontSize: 14 }}>for business</span>
        </div>
        <div style={{ flex: 1 }} />
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', padding: 6 }}>
          <Bell size={18} />
        </button>
        <Link href="/dashboard/settings" style={{ color: '#888', display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, textDecoration: 'none' }}>
          <Settings size={16} /> Settings
        </Link>
        <div style={{
          width: 32, height: 32, borderRadius: '50%', background: '#E6F1FB',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 500, color: '#185FA5'
        }}>EG</div>
      </header>

      <div style={{ display: 'flex', flex: 1 }}>
        {/* Sidebar */}
        <aside style={{
          width: 192, flexShrink: 0, background: '#fff',
          borderRight: '0.5px solid #e0dfd7', padding: '16px 0',
          display: 'flex', flexDirection: 'column'
        }}>
          <div style={{ padding: '0 16px 16px' }}>
            <div style={{ fontWeight: 500, fontSize: 13 }}>{companyName}</div>
            <div style={{ fontSize: 11, color: '#888' }}>Active partner</div>
          </div>

          {['main', 'setup'].map(section => (
            <div key={section}>
              <div style={{
                fontSize: 10, fontWeight: 500, letterSpacing: '0.07em',
                textTransform: 'uppercase', color: '#aaa',
                padding: '12px 16px 5px'
              }}>{section}</div>
              {navItems.filter(i => i.section === section).map(item => {
                const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
                return (
                  <Link key={item.href} href={item.href} style={{
                    display: 'flex', alignItems: 'center', gap: 9,
                    padding: '8px 16px', fontSize: 13, textDecoration: 'none',
                    color: active ? '#FF6B00' : '#5f5e5a',
                    background: active ? '#FFF8F4' : 'transparent',
                    borderLeft: `2px solid ${active ? '#FF6B00' : 'transparent'}`,
                    fontWeight: active ? 500 : 400,
                  }}>
                    <item.icon size={15} />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          ))}

          <div style={{ flex: 1 }} />
          <button onClick={handleLogout} style={{
            display: 'flex', alignItems: 'center', gap: 9,
            padding: '8px 16px', fontSize: 13, color: '#888',
            background: 'none', border: 'none', cursor: 'pointer', width: '100%'
          }}>
            <LogOut size={15} /> Sign out
          </button>
        </aside>

        {/* Main content */}
        <main style={{ flex: 1, padding: 28, overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
