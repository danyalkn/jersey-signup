'use client'

import { useState } from 'react'
import { ROSTER } from '@/lib/roster'

const SIZE_COLORS: Record<string, string> = {
  S: 'bg-sky-500/15 text-sky-300',
  M: 'bg-green-500/15 text-green-300',
  L: 'bg-yellow-500/15 text-yellow-300',
  XL: 'bg-orange-500/15 text-orange-300',
}

export default function PublicRoster() {
  const [copiedKey, setCopiedKey] = useState<number | null>(null)

  const handleCopyEmail = async (jersey: number, email: string) => {
    try {
      await navigator.clipboard.writeText(email)
      setCopiedKey(jersey)
      setTimeout(() => setCopiedKey((k) => (k === jersey ? null : k)), 1500)
    } catch {
      // clipboard unavailable — ignore
    }
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-blue-600 text-white text-xs font-bold uppercase tracking-wider">
          <th className="py-2 px-2 text-center w-20 rounded-l-md">#</th>
          <th className="py-2 px-2 text-left">Player</th>
          <th className="py-2 px-2 text-right w-16 rounded-r-md">Size</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-white/5">
        {ROSTER.map((p) => (
          <tr key={p.jersey_number}>
            <td className="py-2.5 font-black text-white text-center">
              {p.jersey_number}
            </td>
            <td className="py-2.5 px-2 font-medium text-slate-200">
              <span className="inline-flex items-center gap-1.5">
                {p.player_name}
                {p.email && (
                  <button
                    onClick={() => handleCopyEmail(p.jersey_number, p.email!)}
                    title={copiedKey === p.jersey_number ? 'Copied!' : `Copy ${p.email}`}
                    className={`inline-flex items-center justify-center w-5 h-5 rounded-md transition-all ${
                      copiedKey === p.jersey_number
                        ? 'bg-green-500/20 text-green-300 scale-110'
                        : 'text-slate-600 hover:text-blue-400 hover:bg-blue-500/10'
                    }`}
                  >
                    {copiedKey === p.jersey_number ? (
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                        />
                      </svg>
                    )}
                  </button>
                )}
              </span>
            </td>
            <td className="py-2.5 px-2 text-right">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${
                  SIZE_COLORS[p.size] ?? 'bg-white/10 text-slate-300'
                }`}
              >
                {p.size}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
