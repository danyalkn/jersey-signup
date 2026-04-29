'use client'

import { useEffect, useRef, useState } from 'react'
import type { JerseySignup } from '@/lib/supabase'

const SIZES = ['S', 'M', 'L', 'XL'] as const

interface SignupModalProps {
  jerseyNumber: number
  onClose: () => void
  onSuccess: (signup: JerseySignup) => void
  onError: (message: string) => void
}

export default function SignupModal({
  jerseyNumber,
  onClose,
  onSuccess,
  onError,
}: SignupModalProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [size, setSize] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const nameRef = useRef<HTMLInputElement>(null)

  // Focus name input when modal opens
  useEffect(() => {
    nameRef.current?.focus()
  }, [])

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !size || submitting) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jersey_number: jerseyNumber,
          player_name: name.trim(),
          email: email.trim().toLowerCase(),
          size,
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        onError(json.error ?? 'Failed to claim jersey number.')
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
    /* Backdrop */
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            Claim&nbsp;
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-blue-500 text-white text-lg font-black">
              {jerseyNumber}
            </span>
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
          {/* Name */}
          <div>
            <label
              htmlFor="player-name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Your Name
            </label>
            <input
              id="player-name"
              ref={nameRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Johnson"
              maxLength={100}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900
                placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400
                focus:border-transparent transition"
            />
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="player-email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email
            </label>
            <input
              id="player-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              maxLength={255}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900
                placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400
                focus:border-transparent transition"
            />
          </div>

          {/* Size */}
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

          {/* Submit */}
          <button
            type="submit"
            disabled={!name.trim() || !email.trim() || !size || submitting}
            className="w-full bg-blue-500 text-white rounded-lg py-3 font-semibold
              hover:bg-blue-600 active:bg-blue-700
              disabled:opacity-40 disabled:cursor-not-allowed
              transition-colors mt-2"
          >
            {submitting ? 'Claiming…' : 'Claim Jersey'}
          </button>
        </form>
      </div>
    </div>
  )
}
