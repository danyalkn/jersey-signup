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
    <nav className="max-w-5xl mx-auto px-4 pt-6 flex items-center justify-between gap-4">
      <ul className="flex items-center gap-6 text-sm font-black tracking-tight">
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
                    ? 'text-gray-900 border-b-2 border-gray-900 pb-1'
                    : 'text-gray-400 hover:text-gray-700 pb-1 border-b-2 border-transparent transition-colors'
                }
              >
                {tab.label}
              </Link>
            </li>
          )
        })}
      </ul>
      <AdminLockToggle />
    </nav>
  )
}
