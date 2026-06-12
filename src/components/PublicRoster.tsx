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

interface Props {
  initialSignups: JerseySignup[]
}

export default function PublicRoster({ initialSignups }: Props) {
  const { isAdmin, password } = useAdmin()
  const [signups, setSignups] = useState<JerseySignup[]>(initialSignups)
  const [editing, setEditing] = useState<JerseySignup | null>(null)
  const [adding, setAdding] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const channel = supabase
      .channel('public_roster_realtime')
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

  const handleCopyEmail = async (signup: JerseySignup) => {
    if (!signup.email) return
    try {
      await navigator.clipboard.writeText(signup.email)
      setCopiedId(signup.id)
      setTimeout(() => setCopiedId((id) => (id === signup.id ? null : id)), 1500)
    } catch {
      // ignore
    }
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

  const sorted = [...signups].sort((a, b) => a.jersey_number - b.jersey_number)
  const takenNumbers = new Set(signups.map((s) => s.jersey_number))

  return (
    <>
      {error && (
        <div
          role="alert"
          className="mb-4 flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-sm"
        >
          <span className="flex-1">{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-200 font-bold text-base leading-none"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      {isAdmin && (
        <div className="flex justify-end mb-3">
          <button
            onClick={() => {
              setAdding(true)
              setError(null)
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-500 transition-colors"
          >
            <span className="text-base leading-none">+</span> Add Player
          </button>
        </div>
      )}

      {sorted.length === 0 ? (
        <p className="text-sm text-slate-500 py-8 text-center">
          No jerseys claimed yet.
        </p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-blue-600 text-white text-xs font-bold uppercase tracking-wider">
              <th className="py-2 px-2 text-center w-20 rounded-l-md">#</th>
              <th className="py-2 px-2 text-left">Player</th>
              <th
                className={`py-2 px-2 text-right w-16 ${isAdmin ? '' : 'rounded-r-md'}`}
              >
                Size
              </th>
              {isAdmin && <th className="py-2 px-2 w-20 rounded-r-md"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {sorted.map((s) => {
              const pending = confirmDeleteId === s.id
              return (
                <tr key={s.id}>
                  <td className="py-2.5 font-black text-white text-center">
                    {s.jersey_number}
                  </td>
                  <td className="py-2.5 px-2 font-medium text-slate-200">
                    <span className="inline-flex items-center gap-1.5">
                      {s.player_name}
                      {s.email && (
                        <button
                          onClick={() => handleCopyEmail(s)}
                          title={copiedId === s.id ? 'Copied!' : `Copy ${s.email}`}
                          className={`inline-flex items-center justify-center w-5 h-5 rounded-md transition-all ${
                            copiedId === s.id
                              ? 'bg-green-500/20 text-green-300 scale-110'
                              : 'text-slate-600 hover:text-blue-400 hover:bg-blue-500/10'
                          }`}
                        >
                          {copiedId === s.id ? (
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
                        SIZE_COLORS[s.size] ?? 'bg-white/10 text-slate-300'
                      }`}
                    >
                      {s.size}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="py-2.5 px-2 text-right">
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
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(s.id)}
                            className="text-slate-600 hover:text-red-400 transition-colors"
                            title={`Delete ${s.player_name}`}
                            aria-label={`Delete ${s.player_name}`}
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2"
                              />
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
