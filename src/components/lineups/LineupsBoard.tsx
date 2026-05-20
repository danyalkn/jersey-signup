'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAdmin } from '@/lib/useAdmin'
import {
  supabase,
  type JerseySignup,
  type Lineup,
  type LineupSlot,
  type LineupSub,
} from '@/lib/supabase'
import LineupSidebar from './LineupSidebar'
import LineupEditor from './LineupEditor'

interface Props {
  initialSignups: JerseySignup[]
  initialLineups: Lineup[]
  initialSlots: LineupSlot[]
  initialSubs: LineupSub[]
}

function sortLineups(lineups: Lineup[]): Lineup[] {
  return [...lineups].sort((a, b) => b.updated_at.localeCompare(a.updated_at))
}

export default function LineupsBoard({
  initialSignups,
  initialLineups,
  initialSlots,
  initialSubs,
}: Props) {
  const { isAdmin } = useAdmin()
  const [signups, setSignups] = useState<JerseySignup[]>(initialSignups)
  const [lineups, setLineups] = useState<Lineup[]>(sortLineups(initialLineups))
  const [slots, setSlots] = useState<LineupSlot[]>(initialSlots)
  const [subs, setSubs] = useState<LineupSub[]>(initialSubs)
  const [selectedLineupId, setSelectedLineupId] = useState<string | null>(
    initialLineups[0]?.id ?? null
  )

  useEffect(() => {
    if (selectedLineupId === null && lineups.length > 0) {
      setSelectedLineupId(lineups[0].id)
    }
  }, [lineups, selectedLineupId])

  useEffect(() => {
    const channel = supabase
      .channel('lineups_board_realtime')
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
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'lineups' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const row = payload.new as Lineup
            setLineups((prev) =>
              prev.some((l) => l.id === row.id) ? prev : sortLineups([row, ...prev])
            )
          } else if (payload.eventType === 'UPDATE') {
            const row = payload.new as Lineup
            setLineups((prev) =>
              sortLineups(prev.map((l) => (l.id === row.id ? row : l)))
            )
          } else if (payload.eventType === 'DELETE') {
            const row = payload.old as Lineup
            setLineups((prev) => prev.filter((l) => l.id !== row.id))
            setSelectedLineupId((curr) => (curr === row.id ? null : curr))
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'lineup_slots' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const row = payload.new as LineupSlot
            setSlots((prev) =>
              prev.some((s) => s.id === row.id) ? prev : [...prev, row]
            )
          } else if (payload.eventType === 'UPDATE') {
            const row = payload.new as LineupSlot
            setSlots((prev) => prev.map((s) => (s.id === row.id ? row : s)))
          } else if (payload.eventType === 'DELETE') {
            const row = payload.old as LineupSlot
            setSlots((prev) => prev.filter((s) => s.id !== row.id))
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'lineup_subs' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const row = payload.new as LineupSub
            setSubs((prev) =>
              prev.some((s) => s.id === row.id) ? prev : [...prev, row]
            )
          } else if (payload.eventType === 'UPDATE') {
            const row = payload.new as LineupSub
            setSubs((prev) => prev.map((s) => (s.id === row.id ? row : s)))
          } else if (payload.eventType === 'DELETE') {
            const row = payload.old as LineupSub
            setSubs((prev) => prev.filter((s) => s.id !== row.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const selectedLineup = useMemo(
    () => lineups.find((l) => l.id === selectedLineupId) ?? null,
    [lineups, selectedLineupId]
  )
  const selectedSlots = useMemo(
    () =>
      slots
        .filter((s) => s.lineup_id === selectedLineupId)
        .sort((a, b) => a.slot_index - b.slot_index),
    [slots, selectedLineupId]
  )
  const selectedSubs = useMemo(
    () => subs.filter((s) => s.lineup_id === selectedLineupId),
    [subs, selectedLineupId]
  )

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
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
              signups={signups}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-center text-gray-400 py-20">
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
