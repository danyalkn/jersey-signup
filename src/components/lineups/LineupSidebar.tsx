'use client'

import { useEffect, useRef, useState } from 'react'
import { FORMATION_NAMES } from '@/lib/formations'
import { adminHeaders, useAdmin } from '@/lib/useAdmin'
import type { Lineup } from '@/lib/supabase'

interface Props {
  lineups: Lineup[]
  selectedLineupId: string | null
  onSelect: (id: string | null) => void
}

type CreateState =
  | { kind: 'idle' }
  | { kind: 'picking-formation'; query: string }
  | { kind: 'picking-name'; formation: string; name: string }

export default function LineupSidebar({
  lineups,
  selectedLineupId,
  onSelect,
}: Props) {
  const { isAdmin, password } = useAdmin()
  const [create, setCreate] = useState<CreateState>({ kind: 'idle' })
  const [busy, setBusy] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [renaming, setRenaming] = useState<{ id: string; value: string } | null>(
    null
  )
  const [error, setError] = useState<string | null>(null)
  const renameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (renaming) renameInputRef.current?.focus()
  }, [renaming])

  const startCreate = () => {
    setError(null)
    setCreate({ kind: 'picking-formation', query: '' })
  }
  const cancelCreate = () => {
    setCreate({ kind: 'idle' })
    setError(null)
  }

  const filteredFormations =
    create.kind === 'picking-formation'
      ? FORMATION_NAMES.filter((n) => n.includes(create.query.trim()))
      : []

  const pickFormation = (formation: string) =>
    setCreate({ kind: 'picking-name', formation, name: '' })

  const submitCreate = async () => {
    if (create.kind !== 'picking-name') return
    if (create.name.trim().length === 0) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/lineups/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...adminHeaders(password),
        },
        body: JSON.stringify({
          name: create.name.trim(),
          formation: create.formation,
        }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? 'Failed to create lineup')
      onSelect(body.data.id)
      setCreate({ kind: 'idle' })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create lineup')
    } finally {
      setBusy(false)
    }
  }

  const deleteLineup = async (id: string) => {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/lineups/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...adminHeaders(password),
        },
        body: JSON.stringify({ lineup_id: id }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? 'Failed to delete')
      if (selectedLineupId === id) onSelect(null)
      setConfirmDelete(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete')
    } finally {
      setBusy(false)
    }
  }

  const submitRename = async () => {
    if (!renaming || renaming.value.trim().length === 0) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/lineups/rename', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...adminHeaders(password),
        },
        body: JSON.stringify({
          lineup_id: renaming.id,
          name: renaming.value.trim(),
        }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? 'Failed to rename')
      setRenaming(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to rename')
    } finally {
      setBusy(false)
    }
  }

  return (
    <aside className="border-b md:border-b-0 md:border-r border-gray-100 bg-gray-50/50 p-4">
      {isAdmin && (
        <div className="mb-3">
          {create.kind === 'idle' && (
            <button
              onClick={startCreate}
              className="w-full px-3 py-2 text-sm font-bold bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              + Create Lineup
            </button>
          )}
          {create.kind === 'picking-formation' && (
            <div className="space-y-2">
              <input
                autoFocus
                type="text"
                value={create.query}
                onChange={(e) =>
                  setCreate({ kind: 'picking-formation', query: e.target.value })
                }
                onKeyDown={(e) => {
                  if (e.key === 'Escape') cancelCreate()
                }}
                placeholder="Type to filter formations…"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              />
              <ul className="space-y-1 max-h-48 overflow-auto">
                {filteredFormations.length === 0 && (
                  <li className="text-xs text-gray-400 px-2 py-1">
                    No matching formation.
                  </li>
                )}
                {filteredFormations.map((f) => (
                  <li key={f}>
                    <button
                      onClick={() => pickFormation(f)}
                      className="w-full text-left px-2 py-1.5 rounded-md text-sm font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                    >
                      {f}
                    </button>
                  </li>
                ))}
              </ul>
              <button
                onClick={cancelCreate}
                className="w-full text-xs text-gray-400 hover:text-gray-600"
              >
                Cancel
              </button>
            </div>
          )}
          {create.kind === 'picking-name' && (
            <div className="space-y-2">
              <p className="text-xs text-gray-500">
                Formation: <span className="font-bold">{create.formation}</span>
              </p>
              <input
                autoFocus
                type="text"
                value={create.name}
                onChange={(e) =>
                  setCreate({
                    kind: 'picking-name',
                    formation: create.formation,
                    name: e.target.value,
                  })
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitCreate()
                  if (e.key === 'Escape') cancelCreate()
                }}
                placeholder="Lineup name…"
                maxLength={100}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              />
              <div className="flex gap-2">
                <button
                  onClick={submitCreate}
                  disabled={busy || create.name.trim().length === 0}
                  className="flex-1 px-3 py-2 text-sm font-bold bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-40 transition-colors"
                >
                  Create
                </button>
                <button
                  onClick={cancelCreate}
                  className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="text-xs text-red-600 px-1 mb-2">{error}</div>
      )}

      <ul className="space-y-1">
        {lineups.length === 0 && (
          <li className="text-xs text-gray-400 px-2 py-2">No lineups yet.</li>
        )}
        {lineups.map((l) => {
          const active = l.id === selectedLineupId
          const pendingDelete = confirmDelete === l.id
          const isRenaming = renaming?.id === l.id

          return (
            <li
              key={l.id}
              className={[
                'group rounded-lg px-2.5 py-2 flex items-center gap-2 transition-colors',
                active
                  ? 'bg-blue-50 ring-1 ring-blue-200 cursor-pointer'
                  : 'hover:bg-gray-100 cursor-pointer',
              ].join(' ')}
              onClick={() => !isRenaming && onSelect(l.id)}
            >
              <div className="flex-1 min-w-0">
                {isRenaming ? (
                  <input
                    ref={renameInputRef}
                    type="text"
                    value={renaming!.value}
                    onChange={(e) =>
                      setRenaming({ id: l.id, value: e.target.value })
                    }
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') submitRename()
                      if (e.key === 'Escape') setRenaming(null)
                    }}
                    maxLength={100}
                    className="w-full text-sm font-bold text-gray-800 border border-blue-300 rounded px-1.5 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  />
                ) : (
                  <div className="text-sm font-bold text-gray-800 truncate">
                    {l.name}
                  </div>
                )}
                <div className="text-xs font-mono text-gray-400">{l.formation}</div>
              </div>

              {isAdmin && !isRenaming && !pendingDelete && (
                <div className="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setRenaming({ id: l.id, value: l.name })
                      setError(null)
                    }}
                    className="text-gray-300 hover:text-blue-500 transition-colors p-1"
                    title="Rename lineup"
                    aria-label={`Rename ${l.name}`}
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
                    onClick={(e) => {
                      e.stopPropagation()
                      setConfirmDelete(l.id)
                    }}
                    className="text-gray-300 hover:text-red-500 transition-colors p-1"
                    title="Delete lineup"
                    aria-label={`Delete ${l.name}`}
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
                </div>
              )}

              {isAdmin && isRenaming && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1"
                >
                  <button
                    onClick={submitRename}
                    disabled={busy || renaming!.value.trim().length === 0}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 disabled:opacity-40 px-1.5 py-0.5"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setRenaming(null)}
                    className="text-xs text-gray-400 hover:text-gray-600 px-1 py-0.5"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {isAdmin && pendingDelete && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1"
                >
                  <button
                    onClick={() => deleteLineup(l.id)}
                    disabled={busy}
                    className="text-xs font-bold text-red-600 hover:text-red-700 px-1.5 py-0.5"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setConfirmDelete(null)}
                    className="text-xs text-gray-400 hover:text-gray-600 px-1.5 py-0.5"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </aside>
  )
}
