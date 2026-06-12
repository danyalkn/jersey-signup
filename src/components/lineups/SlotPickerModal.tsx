'use client'

import { useEffect, useRef, useState } from 'react'
import type { JerseySignup, LineupSlot } from '@/lib/supabase'

interface Props {
  slot: LineupSlot
  signups: JerseySignup[]
  assignedPlayerIds: Set<string>
  currentPlayerId: string | null
  playerById: Map<string, JerseySignup>
  onAssign: (player_id: string) => void | Promise<void>
  onClear: () => void | Promise<void>
  onClose: () => void
}

export default function SlotPickerModal({
  slot,
  signups,
  assignedPlayerIds,
  currentPlayerId,
  playerById,
  onAssign,
  onClear,
  onClose,
}: Props) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const lower = query.trim().toLowerCase()
  const filtered = signups
    .filter((s) => lower === '' || s.player_name.toLowerCase().includes(lower))
    .sort((a, b) => a.jersey_number - b.jersey_number)

  const currentPlayer = currentPlayerId ? playerById.get(currentPlayerId) : null
  const slotLabel =
    slot.slot_index <= 10
      ? `Starter slot · ${slot.position_code ?? ''}`
      : `Sub slot ${slot.slot_index - 10}`

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 p-4 pt-20"
      onClick={onClose}
    >
      <div
        className="bg-praxis-panel border border-praxis-line rounded-2xl shadow-xl w-full max-w-md p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-blue-400 font-bold">
              {slotLabel}
            </p>
            {currentPlayer ? (
              <p className="text-sm font-bold text-white mt-0.5">
                #{currentPlayer.jersey_number} {currentPlayer.player_name}
              </p>
            ) : (
              <p className="text-sm text-slate-500 mt-0.5 italic">Empty</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-200 text-lg leading-none p-1"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {currentPlayer && (
          <button
            onClick={onClear}
            className="w-full mb-3 px-3 py-2 text-sm font-bold text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors"
          >
            Clear slot
          </button>
        )}

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search players…"
          className="w-full bg-praxis-black border border-praxis-line rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-2"
        />

        <ul className="max-h-72 overflow-auto space-y-1">
          {filtered.length === 0 && (
            <li className="text-xs text-slate-500 px-2 py-2">No players match.</li>
          )}
          {filtered.map((s) => {
            const disabled = assignedPlayerIds.has(s.id)
            return (
              <li key={s.id}>
                <button
                  onClick={() => !disabled && onAssign(s.id)}
                  disabled={disabled}
                  className={[
                    'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-left transition-colors',
                    disabled
                      ? 'opacity-40 cursor-not-allowed'
                      : 'hover:bg-blue-500/10',
                  ].join(' ')}
                >
                  <span className="font-black text-white w-7 text-center">
                    {s.jersey_number}
                  </span>
                  <span className="font-medium text-slate-200 truncate">
                    {s.player_name}
                  </span>
                  {disabled && (
                    <span className="ml-auto text-xs text-slate-500">in lineup</span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
