'use client'

import { useSyncExternalStore } from 'react'
import { FORMATIONS } from './formations'
import { SEED_LINEUPS, type SeedLineup } from './lineupsSeed'

// ---------------------------------------------------------------------------
// Lineups are stored in the browser's localStorage — there is no backend. The
// hard-coded SEED_LINEUPS populate the store the first time a device opens the
// tab; after that, all edits live in localStorage and sync across tabs on the
// same device via the `storage` event. localStorage is per-device, so lineups
// do NOT sync across devices or between people — sharing is by screenshot.
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'praxis_lineups_v1'

const STARTER_MAX = 10 // slots 0-10 are starters, 11-15 are subs

// Persisted shape — identical to a seed lineup.
export type StoredLineup = SeedLineup

// Materialized shapes the UI components consume (player ids are jersey numbers
// rendered as strings).
export type Lineup = {
  id: string
  name: string
  formation: string
  created_at: string
  updated_at: string
}

export type LineupSlot = {
  id: string
  lineup_id: string
  slot_index: number
  position_code: string | null
  player_id: string | null
}

export type LineupSub = {
  id: string
  lineup_id: string
  bench_player_id: string
  starter_player_id: string
}

// --- module state -----------------------------------------------------------

// Deterministic default used for SSR and the hydration render. A frozen deep
// clone of the seed so server and client first-render agree.
const SERVER_SNAPSHOT: StoredLineup[] = SEED_LINEUPS.map(cloneLineup)

let state: StoredLineup[] = SERVER_SNAPSHOT
let hydrated = false
const listeners = new Set<() => void>()

function cloneLineup(l: StoredLineup): StoredLineup {
  return {
    ...l,
    slots: [...l.slots],
    subs: l.subs.map((s) => [s[0], s[1]] as [number, number]),
  }
}

function emit() {
  for (const listener of listeners) listener()
}

function readStorage(): StoredLineup[] | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return null
    return parsed as StoredLineup[]
  } catch {
    return null
  }
}

function writeStorage() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // storage full / unavailable — in-memory state still works for this tab
  }
}

// Pull from localStorage the first time we run on the client. Seeds and
// persists if this device has never stored anything.
function ensureHydrated() {
  if (hydrated || typeof window === 'undefined') return
  hydrated = true
  const stored = readStorage()
  if (stored) {
    state = stored
  } else {
    state = SEED_LINEUPS.map(cloneLineup)
    writeStorage()
  }
}

// --- external-store plumbing ------------------------------------------------

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      const stored = readStorage()
      if (stored) {
        state = stored
        emit()
      }
    }
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

function getSnapshot(): StoredLineup[] {
  ensureHydrated()
  return state
}

function getServerSnapshot(): StoredLineup[] {
  return SERVER_SNAPSHOT
}

// --- mutations (client-only; called from event handlers) --------------------

function commit(next: StoredLineup[]) {
  state = next
  writeStorage()
  emit()
}

function nowIso(): string {
  return new Date().toISOString()
}

function newId(): string {
  try {
    return crypto.randomUUID()
  } catch {
    return `lineup-${Date.now()}-${Math.floor(Math.random() * 1e6)}`
  }
}

// Keep only sub links whose bench player currently sits in a sub slot and
// whose starter currently sits in a starter slot. Called after any slot change
// so moving/removing a player prunes now-invalid "covers" links.
function pruneSubs(l: StoredLineup): [number, number][] {
  const starterKeys = new Set(
    l.slots.slice(0, STARTER_MAX + 1).filter((k): k is number => k != null)
  )
  const benchKeys = new Set(
    l.slots.slice(STARTER_MAX + 1).filter((k): k is number => k != null)
  )
  return l.subs.filter(([bench, starter]) =>
    benchKeys.has(bench) && starterKeys.has(starter)
  )
}

function update(id: string, fn: (l: StoredLineup) => StoredLineup) {
  ensureHydrated()
  const next = state.map((l) => (l.id === id ? fn(cloneLineup(l)) : l))
  commit(next)
}

export function createLineup(name: string, formation: string): string | null {
  ensureHydrated()
  if (!(formation in FORMATIONS)) return null
  const trimmed = name.trim()
  if (trimmed.length === 0) return null
  const id = newId()
  const ts = nowIso()
  const lineup: StoredLineup = {
    id,
    name: trimmed.slice(0, 100),
    formation,
    created_at: ts,
    updated_at: ts,
    slots: new Array(16).fill(null),
    subs: [],
  }
  commit([lineup, ...state])
  return id
}

export function deleteLineup(id: string) {
  ensureHydrated()
  commit(state.filter((l) => l.id !== id))
}

export function renameLineup(id: string, name: string) {
  const trimmed = name.trim()
  if (trimmed.length === 0) return
  update(id, (l) => ({
    ...l,
    name: trimmed.slice(0, 100),
    updated_at: nowIso(),
  }))
}

// Assign a player to a slot (or clear it with playerKey = null). Enforces
// one-player-per-lineup by vacating any other slot that player occupied, then
// prunes sub links invalidated by the change.
export function setSlotPlayer(
  id: string,
  slotIndex: number,
  playerKey: number | null
) {
  update(id, (l) => {
    const slots = [...l.slots]
    if (playerKey != null) {
      for (let i = 0; i < slots.length; i++) {
        if (slots[i] === playerKey) slots[i] = null
      }
    }
    slots[slotIndex] = playerKey
    const pruned = { ...l, slots }
    pruned.subs = pruneSubs(pruned)
    pruned.updated_at = nowIso()
    return pruned
  })
}

export function addSubLink(id: string, benchKey: number, starterKey: number) {
  update(id, (l) => {
    if (benchKey === starterKey) return l
    const exists = l.subs.some(([b, s]) => b === benchKey && s === starterKey)
    if (exists) return l
    // Validity: bench player in a sub slot, starter in a starter slot.
    const inStarter = l.slots.slice(0, STARTER_MAX + 1).includes(starterKey)
    const inBench = l.slots.slice(STARTER_MAX + 1).includes(benchKey)
    if (!inStarter || !inBench) return l
    return {
      ...l,
      subs: [...l.subs, [benchKey, starterKey]],
      updated_at: nowIso(),
    }
  })
}

export function removeSubLink(id: string, benchKey: number, starterKey: number) {
  update(id, (l) => ({
    ...l,
    subs: l.subs.filter(([b, s]) => !(b === benchKey && s === starterKey)),
    updated_at: nowIso(),
  }))
}

// --- selectors / materializers ----------------------------------------------

export function toLineupMeta(l: StoredLineup): Lineup {
  return {
    id: l.id,
    name: l.name,
    formation: l.formation,
    created_at: l.created_at,
    updated_at: l.updated_at,
  }
}

export function slotsOf(l: StoredLineup): LineupSlot[] {
  const spec = FORMATIONS[l.formation] ?? []
  return l.slots.map((key, index) => ({
    id: `${l.id}:${index}`,
    lineup_id: l.id,
    slot_index: index,
    position_code: index <= STARTER_MAX ? spec[index]?.position_code ?? null : null,
    player_id: key != null ? String(key) : null,
  }))
}

export function subsOf(l: StoredLineup): LineupSub[] {
  return l.subs.map(([bench, starter]) => ({
    id: `${l.id}:${bench}:${starter}`,
    lineup_id: l.id,
    bench_player_id: String(bench),
    starter_player_id: String(starter),
  }))
}

// --- hook -------------------------------------------------------------------

export function useStoredLineups(): StoredLineup[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
