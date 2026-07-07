'use client'

import { useState } from 'react'
import { ROSTER, type Player } from '@/lib/roster'

const SIZE_COLORS: Record<string, string> = {
  S: 'bg-sky-500/15 text-sky-300',
  M: 'bg-green-500/15 text-green-300',
  L: 'bg-yellow-500/15 text-yellow-300',
  XL: 'bg-orange-500/15 text-orange-300',
}

function escapeCsv(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function buildCsv(players: Player[]): string {
  const header = ['Jersey #', 'Player Name', 'Email', 'Size'].join(',')
  const rows = players.map((p) =>
    [
      p.jersey_number.toString(),
      escapeCsv(p.player_name),
      escapeCsv(p.email ?? ''),
      p.size,
    ].join(',')
  )
  return [header, ...rows].join('\n')
}

export default function AdminTable() {
  const [copiedKey, setCopiedKey] = useState<number | null>(null)
  const [csvCopied, setCsvCopied] = useState(false)

  const copyEmail = async (jersey: number, email: string) => {
    try {
      await navigator.clipboard.writeText(email)
      setCopiedKey(jersey)
      setTimeout(() => setCopiedKey((k) => (k === jersey ? null : k)), 1500)
    } catch {
      // ignore
    }
  }

  const copyCsv = async () => {
    try {
      await navigator.clipboard.writeText(buildCsv(ROSTER))
      setCsvCopied(true)
      setTimeout(() => setCsvCopied(false), 1500)
    } catch {
      // ignore
    }
  }

  const downloadCsv = () => {
    const csv = buildCsv(ROSTER)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'praxis-fc-roster.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <div className="flex gap-2 mb-4 justify-end">
        <button
          onClick={copyCsv}
          className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
            csvCopied
              ? 'bg-green-500/15 text-green-300'
              : 'bg-white/5 border border-praxis-line text-slate-200 hover:bg-white/10'
          }`}
        >
          {csvCopied ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
              </svg>
              Copy CSV
            </>
          )}
        </button>
        <button
          onClick={downloadCsv}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-500 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          Download CSV
        </button>
      </div>

      <div className="bg-praxis-panel rounded-2xl border border-praxis-line overflow-hidden shadow-[0_0_60px_-15px_rgba(37,99,235,0.25)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-blue-600 text-xs font-bold text-white uppercase tracking-wider">
              <th className="px-5 py-3 text-left w-16">#</th>
              <th className="px-5 py-3 text-left">Player</th>
              <th className="px-5 py-3 text-left">Email</th>
              <th className="px-5 py-3 text-left w-20">Size</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {ROSTER.map((p) => (
              <tr key={p.jersey_number} className="hover:bg-white/5 transition-colors">
                <td className="px-5 py-3.5">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 text-white font-black text-base">
                    {p.jersey_number}
                  </span>
                </td>
                <td className="px-5 py-3.5 font-medium text-slate-200">
                  {p.player_name}
                </td>
                <td className="px-5 py-3.5 text-xs">
                  {p.email ? (
                    <button
                      onClick={() => copyEmail(p.jersey_number, p.email!)}
                      title={copiedKey === p.jersey_number ? 'Copied!' : 'Click to copy'}
                      className={`inline-flex items-center gap-1.5 break-all transition-colors ${
                        copiedKey === p.jersey_number
                          ? 'text-green-300'
                          : 'text-slate-400 hover:text-blue-300'
                      }`}
                    >
                      <span>{p.email}</span>
                      {copiedKey === p.jersey_number ? (
                        <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-3.5 h-3.5 shrink-0 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                        </svg>
                      )}
                    </button>
                  ) : (
                    <span className="text-slate-600">—</span>
                  )}
                </td>
                <td className="px-5 py-3.5">
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
      </div>
    </>
  )
}
