import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'talabat for Business',
  description: 'Partner benefits platform',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
