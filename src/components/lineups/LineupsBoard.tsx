'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAdmin } from '@/lib/useAdmin'
import { LINEUP_PLAYERS } from '@/lib/roster'
import {
  slotsOf,
  subsOf,
  toLineupMeta,
  useStoredLineups,
  type Lineup,
} from '@/lib/lineupStore'
import LineupSidebar from './LineupSidebar'
import LineupEditor from './LineupEditor'

function byUpdatedDesc(a: Lineup, b: Lineup) {
  return b.updated_at.localeCompare(a.updated_at)
}

export default function LineupsBoard() {
  const { isAdmin } = useAdmin()
  const stored = useStoredLineups()
  const [selectedLineupId, setSelectedLineupId] = useState<string | null>(null)

  const lineups = useMemo(
    () => stored.map(toLineupMeta).sort(byUpdatedDesc),
    [stored]
  )

  // Select the most recent lineup once one is available, and recover if the
  // current selection is deleted.
  useEffect(() => {
    if (
      selectedLineupId === null ||
      !lineups.some((l) => l.id === selectedLineupId)
    ) {
      setSelectedLineupId(lineups[0]?.id ?? null)
    }
  }, [lineups, selectedLineupId])

  const selectedStored = useMemo(
    () => stored.find((l) => l.id === selectedLineupId) ?? null,
    [stored, selectedLineupId]
  )

  const selectedLineup = selectedStored ? toLineupMeta(selectedStored) : null
  const selectedSlots = selectedStored ? slotsOf(selectedStored) : []
  const selectedSubs = selectedStored ? subsOf(selectedStored) : []

  return (
    <div className="bg-praxis-panel rounded-2xl border border-praxis-line overflow-hidden shadow-[0_0_60px_-15px_rgba(37,99,235,0.25)]">
      <div className="grid grid-cols-1 md:grid-cols-[16rem_1fr]">
        <LineupSidebar
          lineups={lineups}
          selectedLineupId={selectedLineupId}
          onSelect={setSelectedLineupId}
        />
        <div className="p-5 sm:p-6 min-h-[400px]">
          {selectedLineup ? (
            <LineupEditor
              lineup={selectedLineup}
              slots={selectedSlots}
              subs={selectedSubs}
              players={LINEUP_PLAYERS}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-center text-slate-500 py-20">
              <p className="text-sm">
                {isAdmin
                  ? 'Select a lineup from the left, or create a new one.'
                  : lineups.length === 0
                    ? 'No lineups yet.'
                    : 'Select a lineup from the left.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
