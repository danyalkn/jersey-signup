'use client'

import { useEffect, useState } from 'react'
import { adminHeaders, useAdmin } from '@/lib/useAdmin'
import type { JerseySignup } from '@/lib/supabase'

const SIZES = ['S', 'M', 'L', 'XL'] as const

const INPUT_CLASSES = `w-full bg-praxis-black border border-praxis-line rounded-lg px-3 py-2.5 text-white
  placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500
  focus:border-transparent transition`

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
  const { password } = useAdmin()
  const [playerName, setPlayerName] = useState(signup.player_name)
  const [jerseyNumber, setJerseyNumber] = useState(signup.jersey_number.toString())
  const [email, setEmail] = useState(signup.email ?? '')
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
    if (isNaN(num) || num < 1 || num > 999 || !playerName.trim() || submitting)
      return

    if (num !== signup.jersey_number && takenNumbers.has(num)) {
      onError(`Jersey #${num} is already taken.`)
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/edit', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...adminHeaders(password),
        },
        body: JSON.stringify({
          id: signup.id,
          player_name: playerName.trim(),
          jersey_number: num,
          email: email.trim().length === 0 ? null : email.trim().toLowerCase(),
          size,
        }),
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
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-praxis-panel border border-praxis-line rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">
            Edit — {signup.player_name}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-slate-500 hover:text-slate-200 hover:bg-white/10 transition-colors text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="edit-name"
              className="block text-sm font-medium text-slate-300 mb-1"
            >
              Player Name
            </label>
            <input
              id="edit-name"
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              maxLength={100}
              required
              className={INPUT_CLASSES}
            />
          </div>

          <div>
            <label
              htmlFor="edit-number"
              className="block text-sm font-medium text-slate-300 mb-1"
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
              className={INPUT_CLASSES}
            />
          </div>

          <div>
            <label
              htmlFor="edit-email"
              className="block text-sm font-medium text-slate-300 mb-1"
            >
              Email <span className="text-xs font-normal text-slate-500">(optional)</span>
            </label>
            <input
              id="edit-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              maxLength={255}
              className={INPUT_CLASSES}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
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
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
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
            className="w-full bg-blue-600 text-white rounded-lg py-3 font-semibold
              hover:bg-blue-500 active:bg-blue-700
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
