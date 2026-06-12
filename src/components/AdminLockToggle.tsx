'use client'

import { useEffect, useRef, useState } from 'react'
import { useAdmin } from '@/lib/useAdmin'

export default function AdminLockToggle() {
  const { isAdmin, unlock, lock } = useAdmin()
  const [prompting, setPrompting] = useState(false)
  const [pw, setPw] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (prompting) inputRef.current?.focus()
  }, [prompting])

  useEffect(() => {
    if (!prompting) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPrompting(false)
        setPw('')
        setErr(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [prompting])

  const submit = async () => {
    if (pw.length === 0) return
    setBusy(true)
    setErr(null)
    const ok = await unlock(pw)
    setBusy(false)
    if (ok) {
      setPrompting(false)
      setPw('')
    } else {
      setErr('Wrong password.')
    }
  }

  if (isAdmin) {
    return (
      <button
        onClick={lock}
        className="text-xs font-bold text-blue-300 hover:text-blue-200 transition-colors border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 rounded-md px-2 py-1"
        title="Lock admin mode"
      >
        Admin · Lock
      </button>
    )
  }

  return (
    <>
      <button
        onClick={() => setPrompting(true)}
        className="text-xs font-bold text-slate-500 hover:text-slate-200 transition-colors"
        title="Unlock admin mode"
      >
        Admin
      </button>
      {prompting && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 p-4 pt-24"
          onClick={() => {
            setPrompting(false)
            setPw('')
            setErr(null)
          }}
        >
          <div
            className="bg-praxis-panel border border-praxis-line rounded-2xl shadow-xl w-full max-w-sm p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm font-bold text-white mb-3">Admin password</p>
            <input
              ref={inputRef}
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submit()
              }}
              className="w-full bg-praxis-black border border-praxis-line rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoComplete="current-password"
            />
            {err && <p className="text-xs text-red-300 mt-2">{err}</p>}
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => {
                  setPrompting(false)
                  setPw('')
                  setErr(null)
                }}
                className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={busy || pw.length === 0}
                className="text-xs font-bold bg-blue-600 text-white rounded-md px-3 py-1.5 hover:bg-blue-500 disabled:opacity-40 transition-colors"
              >
                Unlock
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
