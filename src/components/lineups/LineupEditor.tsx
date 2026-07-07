'use client'

import { useState } from 'react'
import { FORMATIONS } from '@/lib/formations'
import { useAdmin } from '@/lib/useAdmin'
import { playerKeyFromId, type LineupPlayer } from '@/lib/roster'
import {
  setSlotPlayer,
  type Lineup,
  type LineupSlot,
  type LineupSub,
} from '@/lib/lineupStore'
import PitchSVG from './PitchSVG'
import SlotPickerModal from './SlotPickerModal'
import PlannedSubs from './PlannedSubs'

interface Props {
  lineup: Lineup
  slots: LineupSlot[]
  subs: LineupSub[]
  players: LineupPlayer[]
}

function lastName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/)
  return parts.length > 1 ? parts[parts.length - 1] : fullName
}

export default function LineupEditor({ lineup, slots, subs, players }: Props) {
  const { isAdmin } = useAdmin()
  const [activeSlotId, setActiveSlotId] = useState<string | null>(null)

  const starters = slots.filter((s) => s.slot_index <= 10)
  const bench = slots.filter((s) => s.slot_index >= 11)
  const formationSpec = FORMATIONS[lineup.formation] ?? []

  const playerById = new Map(players.map((s) => [s.id, s]))
  const assignedPlayerIds = new Set(
    slots
      .map((s) => s.player_id)
      .filter((x): x is string => x !== null)
  )

  const activeSlot = activeSlotId
    ? slots.find((s) => s.id === activeSlotId) ?? null
    : null

  const handleAssign = (player_id: string) => {
    if (!activeSlot) return
    setSlotPlayer(lineup.id, activeSlot.slot_index, playerKeyFromId(player_id))
    setActiveSlotId(null)
  }

  const handleClear = () => {
    if (!activeSlot) return
    setSlotPlayer(lineup.id, activeSlot.slot_index, null)
    setActiveSlotId(null)
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
          players={players}
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
