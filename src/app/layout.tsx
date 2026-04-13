import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Tines Lead Intel | Pre-Interview Account Intelligence',
  description: 'Tines Lead Intel - Security Automation Account Intelligence',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#0a0e1a] min-h-screen antialiased">{children}</body>
    </html>
  )
}
