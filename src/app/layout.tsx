import type { Metadata, Viewport } from 'next'
import { Anton, Inter } from 'next/font/google'
import './globals.css'
import { AdminProvider } from '@/lib/useAdmin'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
// Club display face — heavy condensed type for headings, matching the
// Praxis FC graphics. Anton ships a single 400 weight.
const anton = Anton({ weight: '400', subsets: ['latin'], variable: '--font-anton' })

export const metadata: Metadata = {
  title: 'Praxis FC',
  description: 'Praxis FC — roster, jerseys, and matchday lineups',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${anton.variable} font-sans antialiased bg-praxis-navy text-slate-200`}
      >
        <AdminProvider>{children}</AdminProvider>
      </body>
    </html>
  )
}
