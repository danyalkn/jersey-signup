'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase, type JerseySignup } from '@/lib/supabase'
import SignupModal from './SignupModal'
import EditModal from './EditModal'

const SIZE_COLORS: Record<string, string> = {
  S:  'bg-blue-100 text-blue-700',
  M:  'bg-green-100 text-green-700',
  L:  'bg-yellow-100 text-yellow-700',
  XL: 'bg-orange-100 text-orange-700',
}

interface JerseyGridProps {
  initialSignups: JerseySignup[]
}

export default function JerseyGrid({ initialSignups }: JerseyGridProps) {
  const [signups, setSignups] = useState<JerseySignup[]>(initialSignups)
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null)
  const [editingSignup, setEditingSignup] = useState<JerseySignup | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [customInput, setCustomInput] = useState('')

  const selectedRef = useRef<number | null>(null)
  useEffect(() => {
    selectedRef.current = selectedNumber
  }, [selectedNumber])

  // Subscribe to real-time INSERT and UPDATE events
  useEffect(() => {
    const channel = supabase
      .channel('jersey_signups_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'jersey_signups' },
        (payload) => {
          const newSignup = payload.new as JerseySignup
          setSignups((prev) =>
            prev.some((s) => s.id === newSignup.id) ? prev : [...prev, newSignup]
          )
          if (selectedRef.current === newSignup.jersey_number) {
            setError(
              `Jersey #${newSignup.jersey_number} was just claimed by someone else! Please choose another number.`
            )
            setSelectedNumber(null)
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'jersey_signups' },
        (payload) => {
          const updated = payload.new as JerseySignup
          setSignups((prev) =>
            prev.map((s) => (s.id === updated.id ? updated : s))
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const takenNumbers = new Set(signups.map((s) => s.jersey_number))
  const gridTaken = Array.from({ length: 30 }, (_, i) => i + 1).filter((n) =>
    takenNumbers.has(n)
  ).length
  const totalTaken = takenNumbers.size

  const handleNumberClick = (num: number) => {
    if (takenNumbers.has(num)) return
    setSelectedNumber(num)
    setError(null)
  }

  const handleCustomClaim = () => {
    const num = parseInt(customInput, 10)
    if (isNaN(num) || num < 1 || num > 999) {
      setError('Enter a number between 1 and 999.')
      return
    }
    if (takenNumbers.has(num)) {
      setError(`Jersey #${num} is already taken.`)
      return
    }
    setSelectedNumber(num)
    setError(null)
    setCustomInput('')
  }

  const handleSuccess = (newSignup: JerseySignup) => {
    setSignups((prev) =>
      prev.some((s) => s.id === newSignup.id) ? prev : [...prev, newSignup]
    )
    setSelectedNumber(null)
  }

  const handleEditSuccess = (updated: JerseySignup) => {
    setSignups((prev) =>
      prev.map((s) => (s.id === updated.id ? updated : s))
    )
    setEditingSignup(null)
  }

  const handleError = (message: string) => {
    setError(message)
    setSelectedNumber(null)
    setEditingSignup(null)
  }

  const sortedSignups = [...signups].sort((a, b) => a.jersey_number - b.jersey_number)

  return (
    <>
      {/* Stats legend */}
      <div className="flex items-center gap-6 mb-5 text-sm text-gray-500">
        <span className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded bg-green-200 border border-green-300 inline-block" />
          Available ({30 - gridTaken})
        </span>
        <span className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded bg-red-100 border border-red-200 inline-block" />
          Taken ({totalTaken})
        </span>
      </div>

      {/* Error banner */}
      {error && (
        <div
          role="alert"
          className="mb-4 flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
        >
          <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <span className="flex-1">{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-600 font-bold text-base leading-none"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      {/* Grid (1–30) */}
      <div className="grid grid-cols-5 sm:grid-cols-6 gap-2.5">
        {Array.from({ length: 30 }, (_, i) => i + 1).map((num) => {
          const isTaken = takenNumbers.has(num)
          const isSelected = selectedNumber === num
          const signup = isTaken ? signups.find((s) => s.jersey_number === num) : undefined

          return (
            <button
              key={num}
              onClick={() => handleNumberClick(num)}
              disabled={isTaken}
              title={
                isTaken && signup
                  ? `${signup.player_name} (${signup.size})`
                  : `Claim #${num}`
              }
              className={[
                'aspect-square rounded-xl text-xl font-black transition-all duration-150',
                'flex items-center justify-center select-none',
                isTaken
                  ? 'bg-red-50 text-red-300 cursor-not-allowed border-2 border-red-100'
                  : isSelected
                  ? 'bg-blue-500 text-white border-2 border-blue-600 scale-105 shadow-lg ring-2 ring-blue-300'
                  : 'bg-green-50 text-green-700 border-2 border-green-200 hover:bg-green-100 hover:border-green-300 hover:scale-105 cursor-pointer active:scale-95',
              ].join(' ')}
            >
              {num}
            </button>
          )
        })}
      </div>

      {/* Custom number input */}
      <div className="mt-5 pt-5 border-t border-gray-100">
        <p className="text-sm text-gray-500 mb-2">Want a different number?</p>
        <div className="flex gap-2">
          <input
            type="number"
            min={1}
            max={999}
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCustomClaim()
            }}
            placeholder="e.g. 99"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-gray-900
              placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400
              focus:border-transparent transition text-sm"
          />
          <button
            onClick={handleCustomClaim}
            disabled={!customInput}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-semibold
              hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Claim
          </button>
        </div>
      </div>

      {/* Live roster */}
      <div className="mt-6 pt-5 border-t border-gray-100">
        <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 text-center">
          Current Roster
        </p>
        {sortedSignups.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">No jerseys claimed yet</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <th className="pb-2 text-center w-24">Jersey #</th>
                <th className="pb-2 text-center">Player Name</th>
                <th className="pb-2 text-right w-16">Size</th>
                <th className="pb-2 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sortedSignups.map((s) => (
                <tr key={s.id}>
                  <td className="py-2.5 font-black text-gray-800 text-center">{s.jersey_number}</td>
                  <td className="py-2.5 font-medium text-gray-700 text-center">{s.player_name}</td>
                  <td className="py-2.5 text-right">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${
                        SIZE_COLORS[s.size] ?? 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {s.size}
                    </span>
                  </td>
                  <td className="py-2.5 text-right">
                    <button
                      onClick={() => {
                        setEditingSignup(s)
                        setError(null)
                      }}
                      className="text-gray-300 hover:text-blue-500 transition-colors"
                      title={`Edit ${s.player_name}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedNumber !== null && (
        <SignupModal
          jerseyNumber={selectedNumber}
          onClose={() => setSelectedNumber(null)}
          onSuccess={handleSuccess}
          onError={handleError}
        />
      )}

      {editingSignup !== null && (
        <EditModal
          signup={editingSignup}
          takenNumbers={takenNumbers}
          onClose={() => setEditingSignup(null)}
          onSuccess={handleEditSuccess}
          onError={handleError}
        />
      )}
    </>
  )
}
