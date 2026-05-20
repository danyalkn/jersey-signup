'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

const STORAGE_KEY = 'praxis_admin_password'

type AdminCtx = {
  isAdmin: boolean
  password: string | null
  unlock: (pw: string) => Promise<boolean>
  lock: () => void
}

const Context = createContext<AdminCtx | null>(null)

export function AdminProvider({ children }: { children: ReactNode }) {
  const [password, setPassword] = useState<string | null>(null)

  useEffect(() => {
    try {
      setPassword(window.localStorage.getItem(STORAGE_KEY))
    } catch {
      // localStorage unavailable — admin stays locked
    }
  }, [])

  const unlock = useCallback(async (pw: string): Promise<boolean> => {
    const res = await fetch('/api/auth/check', {
      method: 'POST',
      headers: { 'x-admin-password': pw },
    })
    if (!res.ok) return false
    try {
      window.localStorage.setItem(STORAGE_KEY, pw)
    } catch {
      // ignore — session-only unlock still works via state
    }
    setPassword(pw)
    return true
  }, [])

  const lock = useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
    setPassword(null)
  }, [])

  return (
    <Context.Provider value={{ isAdmin: password !== null, password, unlock, lock }}>
      {children}
    </Context.Provider>
  )
}

export function useAdmin(): AdminCtx {
  const ctx = useContext(Context)
  if (!ctx) {
    // Hook called outside provider — return a locked stub so callers don't crash.
    return {
      isAdmin: false,
      password: null,
      unlock: async () => false,
      lock: () => {},
    }
  }
  return ctx
}

export function adminHeaders(password: string | null): Record<string, string> {
  return password ? { 'x-admin-password': password } : {}
}
