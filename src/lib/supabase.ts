import { createClient } from '@supabase/supabase-js'

export type JerseySignup = {
  id: string
  jersey_number: number
  player_name: string
  email: string | null
  size: string
  notified: boolean
  created_at: string
}

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

export const STARTER_SLOT_MIN = 0
export const STARTER_SLOT_MAX = 10
export const BENCH_SLOT_MIN = 11
export const BENCH_SLOT_MAX = 15

// Singleton browser client — used for real-time subscriptions in client components.
// Server-side code (API routes, Server Components) creates its own client inline
// so it does not ship this module to the browser bundle unnecessarily.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
