'use client'

import { useState } from 'react'
import { adminHeaders, useAdmin } from '@/lib/useAdmin'
import type { JerseySignup, LineupSlot, LineupSub } from '@/lib/supabase'

interface Props {
  lineupId: string
  starters: LineupSlot[]
  bench: LineupSlot[]
  subs: LineupSub[]
  playerById: Map<string, JerseySignup>
}

export default function PlannedSubs({
  lineupId,
  starters,
  bench,
  subs,
  playerById,
}: Props) {
  const { isAdmin, password } = useAdmin()
  // Bench-player id whose "+ Add" menu is currently open.
  const [openFor, setOpenFor] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const filledBench = bench
    .filter((b) => b.player_id !== null)
    .map((b) => ({ slot: b, player: playerById.get(b.player_id!) }))
    .filter((x): x is { slot: LineupSlot; player: JerseySignup } => !!x.player)
    .sort((a, b) => a.slot.slot_index - b.slot.slot_index)

  const filledStarters = starters
    .filter((s) => s.player_id !== null)
    .map((s) => ({ slot: s, player: playerById.get(s.player_id!) }))
    .filter((x): x is { slot: LineupSlot; player: JerseySignup } => !!x.player)
    .sort((a, b) => a.slot.slot_index - b.slot.slot_index)

  const handleAdd = async (bench_player_id: string, starter_player_id: string) => {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/lineups/add-sub-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...adminHeaders(password),
        },
        body: JSON.stringify({
          lineup_id: lineupId,
          bench_player_id,
          starter_player_id,
        }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? 'Failed')
      setOpenFor(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed')
    } finally {
      setBusy(false)
    }
  }

  const handleRemove = async (sub_id: string) => {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/lineups/remove-sub-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...adminHeaders(password),
        },
        body: JSON.stringify({ sub_id }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? 'Failed')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-2">
        Planned subs
      </p>

      {error && (
        <div className="mb-2 px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-300">
          {error}
        </div>
      )}

      {filledBench.length === 0 ? (
        <p className="text-xs text-slate-500 italic">
          {isAdmin
            ? 'Assign subs first to plan substitutions.'
            : 'No subs assigned yet.'}
        </p>
      ) : (
        <ul className="space-y-2">
          {filledBench.map(({ slot, player }) => {
            const links = subs.filter((x) => x.bench_player_id === player.id)
            const linkedStarterIds = new Set(links.map((l) => l.starter_player_id))
            const availableStarters = filledStarters.filter(
              ({ player: sp }) => !linkedStarterIds.has(sp.id)
            )
            const menuOpen = openFor === player.id

            return (
              <li key={slot.id} className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-sm font-bold text-white">
                  <span className="text-yellow-300 bg-yellow-500/10 border border-yellow-500/30 rounded px-1.5 py-0.5 text-xs">
                    #{player.jersey_number}
                  </span>
                  {player.player_name}
                </span>
                <span className="text-xs text-slate-500">→ covers:</span>

                {links.length === 0 && !menuOpen && isAdmin && (
                  <button
                    onClick={() => setOpenFor(player.id)}
                    className="text-xs text-slate-500 hover:text-blue-300 italic"
                  >
                    + Add a player they cover
                  </button>
                )}
                {links.length === 0 && !isAdmin && (
                  <span className="text-xs text-slate-600 italic">
                    nobody yet
                  </span>
                )}

                {links.map((link) => {
                  const starter = playerById.get(link.starter_player_id)
                  if (!starter) return null
                  return (
                    <span
                      key={link.id}
                      className="inline-flex items-center gap-1 bg-blue-500/10 text-blue-300 border border-blue-500/40 rounded-full pl-2 pr-1 py-0.5 text-xs font-bold"
                    >
                      #{starter.jersey_number} {starter.player_name}
                      {isAdmin && (
                        <button
                          onClick={() => handleRemove(link.id)}
                          disabled={busy}
                          className="text-blue-400 hover:text-blue-200 ml-0.5 leading-none px-1"
                          aria-label="Remove link"
                        >
                          ×
                        </button>
                      )}
                    </span>
                  )
                })}

                {isAdmin &&
                  links.length > 0 &&
                  !menuOpen &&
                  availableStarters.length > 0 && (
                    <button
                      onClick={() => setOpenFor(player.id)}
                      className="text-xs font-bold text-blue-400 hover:text-blue-300 px-1.5 py-0.5"
                    >
                      + Add
                    </button>
                  )}

                {isAdmin && menuOpen && (
                  <div className="inline-flex items-center gap-1 flex-wrap">
                    {availableStarters.length === 0 ? (
                      <span className="text-xs text-slate-500 italic">
                        No more starters to cover.
                      </span>
                    ) : (
                      availableStarters.map(({ player: sp }) => (
                        <button
                          key={sp.id}
                          onClick={() => handleAdd(player.id, sp.id)}
                          disabled={busy}
                          className="text-xs font-bold text-blue-300 hover:bg-blue-500/20 bg-white/5 border border-blue-500/30 rounded-full px-2 py-0.5"
                        >
                          #{sp.jersey_number} {sp.player_name}
                        </button>
                      ))
                    )}
                    <button
                      onClick={() => setOpenFor(null)}
                      className="text-xs text-slate-500 hover:text-slate-300 px-1.5 py-0.5"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
