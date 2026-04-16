'use client'

import { useEffect, useState } from 'react'
import type { JerseySignup } from '@/lib/supabase'

const SIZES = ['S', 'M', 'L', 'XL'] as const

interface EditModalProps {
  signup: JerseySignup
  takenNumbers: Set<number>
  onClose: () => void
  onSuccess: (updated: JerseySignup) => void
  onError: (message: string) => void
}

export default function EditModal({
  signup,
  takenNumbers,
  onClose,
  onSuccess,
  onError,
}: EditModalProps) {
  const [jerseyNumber, setJerseyNumber] = useState(signup.jersey_number.toString())
  const [size, setSize] = useState(signup.size)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const num = parseInt(jerseyNumber, 10)
    if (isNaN(num) || num < 1 || num > 999 || submitting) return

    if (num !== signup.jersey_number && takenNumbers.has(num)) {
      onError(`Jersey #${num} is already taken.`)
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/edit', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: signup.id, jersey_number: num, size }),
      })
      const json = await res.json()
      if (!res.ok) {
        onError(json.error ?? 'Failed to update.')
      } else {
        onSuccess(json.data as JerseySignup)
      }
    } catch {
      onError('Network error — please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            Edit — {signup.player_name}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="edit-number"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Jersey Number
            </label>
            <input
              id="edit-number"
              type="number"
              min={1}
              max={999}
              value={jerseyNumber}
              onChange={(e) => setJerseyNumber(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900
                focus:outline-none focus:ring-2 focus:ring-blue-400
                focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Jersey Size
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {SIZES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSize(s)}
                  className={`py-2 rounded-lg text-sm font-semibold transition-colors ${
                    size === s
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={!jerseyNumber || submitting}
            className="w-full bg-blue-500 text-white rounded-lg py-3 font-semibold
              hover:bg-blue-600 active:bg-blue-700
              disabled:opacity-40 disabled:cursor-not-allowed
              transition-colors mt-2"
          >
            {submitting ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  )
}
