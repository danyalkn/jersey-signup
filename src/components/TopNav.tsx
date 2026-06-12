'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAdmin } from '@/lib/useAdmin'
import AdminLockToggle from './AdminLockToggle'

// Public nav. The Lineups route exists but is intentionally not listed here —
// admins reach it directly. When admin mode is unlocked, a discreet Lineups
// link appears so admins can navigate without re-typing the URL.
const PUBLIC_TABS: Array<{ href: string; label: string }> = [
  { href: '/', label: 'Roster' },
  { href: '/admin', label: 'Admin' },
]

export default function TopNav() {
  const pathname = usePathname()
  const { isAdmin } = useAdmin()

  const tabs = isAdmin
    ? [...PUBLIC_TABS, { href: '/lineups', label: 'Lineups' }]
    : PUBLIC_TABS

  return (
    <nav className="max-w-5xl mx-auto px-4 pt-6">
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-praxis-line/60">
        <div className="flex items-center gap-8">
          {/* Wordmark — four stars over the club name, as on the crest */}
          <Link href="/" className="select-none leading-none shrink-0">
            <span className="block text-[8px] tracking-[0.4em] text-blue-400 text-center mb-1">
              ★ ★ ★ ★
            </span>
            <span className="block font-display italic text-xl text-white tracking-wider">
              PRAXIS FC
            </span>
          </Link>

          <ul className="flex items-center gap-6 text-xs font-bold uppercase tracking-widest">
            {tabs.map((tab) => {
              const active =
                tab.href === '/'
                  ? pathname === '/'
                  : pathname === tab.href || pathname.startsWith(`${tab.href}/`)
              return (
                <li key={tab.href}>
                  <Link
                    href={tab.href}
                    className={
                      active
                        ? 'text-white border-b-2 border-blue-500 pb-1'
                        : 'text-slate-500 hover:text-slate-200 pb-1 border-b-2 border-transparent transition-colors'
                    }
                  >
                    {tab.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
        <AdminLockToggle />
      </div>
    </nav>
  )
}
