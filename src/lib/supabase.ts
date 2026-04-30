import { createClient } from '@supabase/supabase-js'

export type JerseySignup = {
  id: string
  jersey_number: number
  player_name: string
  email: string
  size: string
  notified: boolean
  created_at: string
}

// Singleton browser client — used for real-time subscriptions in client components.
// Server-side code (API routes, Server Components) creates its own client inline
// so it does not ship this module to the browser bundle unnecessarily.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
