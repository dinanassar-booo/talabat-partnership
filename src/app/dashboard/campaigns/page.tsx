'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, BarChart2 } from 'lucide-react'

type Campaign = {
  id: string; name: string; benefit_name: string; benefit_slug: string
  headcount: number; credit_value: number; cycle_type: string
  budget_used: number; budget_total: number; status: string
  min_order_value: number; validity_days: number
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [launching, setLaunching] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => { loadCampaigns() }, [])

  async function loadCampaigns() {
    const res = await fetch('/api/campaigns')
    const data = await res.json()
    setCampaigns(data.campaigns || [])
  }

  async function handleLaunch(campaignId: string) {
    setLaunching(campaignId); setError(''); setSuccess('')
    const res = await fetch('/api/campaigns/launch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaignId })
    })
    const data = await res.json()
    setLaunching(null)
    if (!res.ok) { setError(data.error || 'Failed to launch campaign') }
    else { setSuccess('Campaign activated. Generate codes from the Codes tab.'); loadCampaigns() }
  }

  async function handleDelete(campaignId: string, name: string) {
    if (!confirm(`Delete "${name}" and all its codes? This cannot be undone.`)) return
    setDeleting(campaignId); setError('')
    const res = await fetch(`/api/campaigns/${campaignId}`, { method: 'DELETE' })
    setDeleting(null)
    if (!res.ok) { setError('Failed to delete campaign'); return }
    loadCampaigns()
  }

  const totalBudget = campaigns.reduce((s, c) => s + Number(c.budget_total), 0)
  const totalGmv = campaigns.reduce((s, c) => s + Number(c.budget_used), 0)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 500, margin: 0 }}>Campaigns</h1>
          <p style={{ color: '#888', fontSize: 13, margin: '4px 0 0' }}>Track all benefit campaigns.</p>
        </div>
        <Link href="/dashboard/campaigns/new"><button className="btn-tlb"><Plus size={14} /> New campaign</button></Link>
      </div>

      {error && <div style={{ color: '#A32D2D', background: '#FCEBEB', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>{error}</div>}
      {success && <div style={{ color: '#3B6D11', background: '#EDF7E6', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>{success}</div>}

      {campaigns.length > 0 && (
