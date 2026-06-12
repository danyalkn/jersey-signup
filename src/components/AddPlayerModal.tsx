'use client'

import { useEffect, useState } from 'react'
import { adminHeaders, useAdmin } from '@/lib/useAdmin'

const SIZES = ['S', 'M', 'L', 'XL'] as const

interface AddPlayerModalProps {
  takenNumbers: Set<number>
  onClose: () => void
  onSuccess: () => void
  onError: (message: string) => void
}

export default function AddPlayerModal({
  takenNumbers,
  onClose,
  onSuccess,
  onError,
}: AddPlayerModalProps) {
  const { password } = useAdmin()
  const [playerName, setPlayerName] = useState('')
  const [jerseyNumber, setJerseyNumber] = useState('')
  const [email, setEmail] = useState('')
  const [size, setSize] = useState<(typeof SIZES)[number]>('M')
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
    if (isNaN(num) || num < 1 || num > 999 || !playerName.trim() || submitting)
      return

    if (takenNumbers.has(num)) {
      onError(`Jersey #${num} is already taken.`)
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/signups/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...adminHeaders(password),
        },
        body: JSON.stringify({
          player_name: playerName.trim(),
          jersey_number: num,
          email:
            email.trim().length === 0 ? null : email.trim().toLowerCase(),
          size,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        onError(json.error ?? 'Failed to add player.')
      } else {
        onSuccess()
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
          <h2 className="text-xl font-bold text-gray-900">Add Player</h2>
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
              htmlFor="add-name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Player Name
            </label>
            <input
              id="add-name"
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              maxLength={100}
              required
              autoFocus
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900
                focus:outline-none focus:ring-2 focus:ring-blue-400
                focus:border-transparent transition"
            />
          </div>

          <div>
            <label
              htmlFor="add-number"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Jersey Number
            </label>
            <input
              id="add-number"
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
            <label
              htmlFor="add-email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email <span className="text-xs font-normal text-gray-400">(optional)</span>
            </label>
            <input
              id="add-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              maxLength={255}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900
                placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400
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
            disabled={!jerseyNumber || !playerName.trim() || submitting}
            className="w-full bg-blue-500 text-white rounded-lg py-3 font-semibold
              hover:bg-blue-600 active:bg-blue-700
              disabled:opacity-40 disabled:cursor-not-allowed
              transition-colors mt-2"
          >
            {submitting ? 'Adding…' : 'Add Player'}
          </button>
        </form>
      </div>
    </div>
  )
}
