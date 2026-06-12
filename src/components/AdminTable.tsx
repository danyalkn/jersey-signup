'use client'

import { useEffect, useState } from 'react'
import { adminHeaders, useAdmin } from '@/lib/useAdmin'
import { supabase, type JerseySignup } from '@/lib/supabase'
import AddPlayerModal from './AddPlayerModal'
import EditModal from './EditModal'

const SIZE_COLORS: Record<string, string> = {
  S: 'bg-sky-500/15 text-sky-300',
  M: 'bg-green-500/15 text-green-300',
  L: 'bg-yellow-500/15 text-yellow-300',
  XL: 'bg-orange-500/15 text-orange-300',
}

interface AdminTableProps {
  signups: JerseySignup[]
}

function escapeCsv(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function buildCsv(signups: JerseySignup[]): string {
  const header = ['Jersey #', 'Player Name', 'Email', 'Size'].join(',')
  const rows = signups.map((s) =>
    [
      s.jersey_number.toString(),
      escapeCsv(s.player_name),
      escapeCsv(s.email ?? ''),
      s.size,
    ].join(',')
  )
  return [header, ...rows].join('\n')
}

export default function AdminTable({ signups: initialSignups }: AdminTableProps) {
  const { isAdmin, password } = useAdmin()
  const [signups, setSignups] = useState<JerseySignup[]>(initialSignups)
  const [copiedRow, setCopiedRow] = useState<string | null>(null)
  const [csvCopied, setCsvCopied] = useState(false)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [editing, setEditing] = useState<JerseySignup | null>(null)
  const [adding, setAdding] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const channel = supabase
      .channel('admin_table_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'jersey_signups' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const row = payload.new as JerseySignup
            setSignups((prev) =>
              prev.some((s) => s.id === row.id) ? prev : [...prev, row]
            )
          } else if (payload.eventType === 'UPDATE') {
            const row = payload.new as JerseySignup
            setSignups((prev) => prev.map((s) => (s.id === row.id ? row : s)))
          } else if (payload.eventType === 'DELETE') {
            const row = payload.old as JerseySignup
            setSignups((prev) => prev.filter((s) => s.id !== row.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const toggleNotified = async (signup: JerseySignup) => {
    if (!isAdmin) return
    const newValue = !signup.notified
    setSignups((prev) =>
      prev.map((s) => (s.id === signup.id ? { ...s, notified: newValue } : s))
    )
    setPendingId(signup.id)
    try {
      const res = await fetch('/api/notified', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...adminHeaders(password),
        },
        body: JSON.stringify({ id: signup.id, notified: newValue }),
      })
      if (!res.ok) throw new Error('Failed')
    } catch {
      setSignups((prev) =>
        prev.map((s) => (s.id === signup.id ? { ...s, notified: !newValue } : s))
      )
    } finally {
      setPendingId(null)
    }
  }

  const copyEmail = async (signup: JerseySignup) => {
    if (!signup.email) return
    try {
      await navigator.clipboard.writeText(signup.email)
      setCopiedRow(signup.id)
      setTimeout(() => setCopiedRow((id) => (id === signup.id ? null : id)), 1500)
    } catch {
      // ignore
    }
  }

  const copyCsv = async () => {
    try {
      await navigator.clipboard.writeText(buildCsv(signups))
      setCsvCopied(true)
      setTimeout(() => setCsvCopied(false), 1500)
    } catch {
      // ignore
    }
  }

  const downloadCsv = () => {
    const csv = buildCsv(signups)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const date = new Date().toISOString().slice(0, 10)
    link.href = url
    link.download = `praxis-fc-roster-${date}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleDelete = async (id: string) => {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/signups/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...adminHeaders(password),
        },
        body: JSON.stringify({ id }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to delete.')
      setConfirmDeleteId(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete.')
    } finally {
      setBusy(false)
    }
  }

  const takenNumbers = new Set(signups.map((s) => s.jersey_number))

  return (
    <>
      {error && (
        <div className="mb-3 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-300">
          {error}
        </div>
      )}

      <div className="flex gap-2 mb-4 justify-end">
        {isAdmin && (
          <button
            onClick={() => {
              setAdding(true)
              setError(null)
            }}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-500 transition-colors"
          >
            <span className="text-base leading-none">+</span> Add Player
          </button>
        )}
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

      {signups.length === 0 ? (
        <div className="bg-praxis-panel rounded-2xl border border-praxis-line py-16 text-center text-slate-500">
          <p className="font-medium">No jerseys claimed yet</p>
        </div>
      ) : (
      <div className="bg-praxis-panel rounded-2xl border border-praxis-line overflow-hidden shadow-[0_0_60px_-15px_rgba(37,99,235,0.25)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-blue-600 text-xs font-bold text-white uppercase tracking-wider">
              <th className="px-5 py-3 text-left w-16">#</th>
              <th className="px-5 py-3 text-left">Player</th>
              <th className="px-5 py-3 text-left">Email</th>
              <th className="px-5 py-3 text-left w-20">Size</th>
              <th className="px-5 py-3 text-center w-16">Sent</th>
              {isAdmin && <th className="px-5 py-3 text-right w-24">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {[...signups]
              .sort((a, b) => a.jersey_number - b.jersey_number)
              .map((s) => {
                const pending = confirmDeleteId === s.id
                return (
                  <tr key={s.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 text-white font-black text-base">
                        {s.jersey_number}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-200">
                      {s.player_name}
                    </td>
                    <td className="px-5 py-3.5 text-xs">
                      {s.email ? (
                        <button
                          onClick={() => copyEmail(s)}
                          title={copiedRow === s.id ? 'Copied!' : 'Click to copy'}
                          className={`inline-flex items-center gap-1.5 break-all transition-colors ${
                            copiedRow === s.id
                              ? 'text-green-300'
                              : 'text-slate-400 hover:text-blue-300'
                          }`}
                        >
                          <span>{s.email}</span>
                          {copiedRow === s.id ? (
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
                          SIZE_COLORS[s.size] ?? 'bg-white/10 text-slate-300'
                        }`}
                      >
                        {s.size}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <button
                        onClick={() => toggleNotified(s)}
                        disabled={!isAdmin || pendingId === s.id}
                        title={
                          !isAdmin
                            ? 'Unlock admin to toggle'
                            : s.notified
                              ? 'Mark as not sent'
                              : 'Mark as emailed'
                        }
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-md border-2 transition-all disabled:cursor-not-allowed ${
                          s.notified
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'bg-transparent border-slate-600 hover:border-green-400'
                        } ${!isAdmin ? 'opacity-60' : ''}`}
                      >
                        {s.notified && (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    </td>
                    {isAdmin && (
                      <td className="px-5 py-3.5 text-right">
                        {pending ? (
                          <span className="inline-flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(s.id)}
                              disabled={busy}
                              className="text-xs font-bold text-red-400 hover:text-red-300 px-1.5 py-0.5"
                            >
                              Delete
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="text-xs text-slate-500 hover:text-slate-300 px-1 py-0.5"
                            >
                              Cancel
                            </button>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-2">
                            <button
                              onClick={() => {
                                setEditing(s)
                                setError(null)
                              }}
                              className="text-slate-600 hover:text-blue-400 transition-colors"
                              title={`Edit ${s.player_name}`}
                              aria-label={`Edit ${s.player_name}`}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(s.id)}
                              className="text-slate-600 hover:text-red-400 transition-colors"
                              title={`Delete ${s.player_name}`}
                              aria-label={`Delete ${s.player_name}`}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2" />
                              </svg>
                            </button>
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                )
              })}
          </tbody>
        </table>
      </div>
      )}

      {editing && (
        <EditModal
          signup={editing}
          takenNumbers={takenNumbers}
          onClose={() => setEditing(null)}
          onSuccess={() => setEditing(null)}
          onError={(message) => {
            setError(message)
            setEditing(null)
          }}
        />
      )}

      {adding && (
        <AddPlayerModal
          takenNumbers={takenNumbers}
          onClose={() => setAdding(false)}
          onSuccess={() => setAdding(false)}
          onError={(message) => {
            setError(message)
            setAdding(false)
          }}
        />
      )}
    </>
  )
}
