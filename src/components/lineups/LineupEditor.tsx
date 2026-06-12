'use client'

import { useState } from 'react'
import { FORMATIONS } from '@/lib/formations'
import { adminHeaders, useAdmin } from '@/lib/useAdmin'
import type { JerseySignup, Lineup, LineupSlot, LineupSub } from '@/lib/supabase'
import PitchSVG from './PitchSVG'
import SlotPickerModal from './SlotPickerModal'
import PlannedSubs from './PlannedSubs'

interface Props {
  lineup: Lineup
  slots: LineupSlot[]
  subs: LineupSub[]
  signups: JerseySignup[]
}

function lastName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/)
  return parts.length > 1 ? parts[parts.length - 1] : fullName
}

export default function LineupEditor({ lineup, slots, subs, signups }: Props) {
  const { isAdmin, password } = useAdmin()
  const [activeSlotId, setActiveSlotId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const starters = slots.filter((s) => s.slot_index <= 10)
  const bench = slots.filter((s) => s.slot_index >= 11)
  const formationSpec = FORMATIONS[lineup.formation] ?? []

  const playerById = new Map(signups.map((s) => [s.id, s]))
  const assignedPlayerIds = new Set(
    slots
      .map((s) => s.player_id)
      .filter((x): x is string => x !== null)
  )

  const activeSlot = activeSlotId
    ? slots.find((s) => s.id === activeSlotId) ?? null
    : null

  const handleAssign = async (player_id: string) => {
    if (!activeSlot) return
    setError(null)
    try {
      const res = await fetch('/api/lineups/assign-player', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...adminHeaders(password),
        },
        body: JSON.stringify({ slot_id: activeSlot.id, player_id }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? 'Failed to assign')
      setActiveSlotId(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to assign')
    }
  }

  const handleClear = async () => {
    if (!activeSlot) return
    setError(null)
    try {
      const res = await fetch('/api/lineups/clear-slot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...adminHeaders(password),
        },
        body: JSON.stringify({ slot_id: activeSlot.id }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? 'Failed to clear')
      setActiveSlotId(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to clear')
    }
  }

  const handleSlotClick = (slotId: string) => {
    if (!isAdmin) return
    setActiveSlotId(slotId)
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="font-display italic uppercase text-2xl text-white tracking-wide">
          {lineup.name}
        </h2>
        <p className="text-xs text-slate-500 font-mono mt-0.5">{lineup.formation}</p>
      </div>

      {error && (
        <div className="mb-3 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-300">
          {error}
        </div>
      )}

      <PitchSVG
        starters={starters}
        formationSpec={formationSpec}
        playerById={playerById}
        onSlotClick={handleSlotClick}
      />

      <div className="mt-5">
        <p className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-2">
          Subs
        </p>
        <div className="grid grid-cols-5 gap-2">
          {bench.map((slot) => {
            const player = slot.player_id ? playerById.get(slot.player_id) : null
            return (
              <button
                key={slot.id}
                onClick={() => handleSlotClick(slot.id)}
                disabled={!isAdmin}
                className={[
                  'rounded-lg border-2 px-2 py-3 text-center transition-colors',
                  player
                    ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300'
                    : 'bg-white/5 border-dashed border-slate-700 text-slate-500',
                  isAdmin
                    ? player
                      ? 'hover:bg-yellow-500/20 cursor-pointer'
                      : 'hover:bg-white/10 cursor-pointer'
                    : 'cursor-default',
                ].join(' ')}
              >
                {player ? (
                  <>
                    <div className="text-lg font-black leading-none">
                      {player.jersey_number}
                    </div>
                    <div className="text-[11px] mt-1 truncate">
                      {lastName(player.player_name)}
                    </div>
                  </>
                ) : (
                  <div className="text-xs py-1">Empty</div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-5">
        <PlannedSubs
          lineupId={lineup.id}
          starters={starters}
          bench={bench}
          subs={subs}
          playerById={playerById}
        />
      </div>

      {activeSlot && (
        <SlotPickerModal
          slot={activeSlot}
          positionLabel={
            formationSpec[activeSlot.slot_index]?.position_code ??
            activeSlot.position_code
          }
          signups={signups}
          assignedPlayerIds={assignedPlayerIds}
          currentPlayerId={activeSlot.player_id}
          playerById={playerById}
          onAssign={handleAssign}
          onClear={handleClear}
          onClose={() => setActiveSlotId(null)}
        />
      )}
    </div>
  )
}
