import { Suspense } from 'react'
import NewCampaignForm from './form'

export default function NewCampaignPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24, color: '#888' }}>Loading…</div>}>
      <NewCampaignForm />
    </Suspense>
  )
}
