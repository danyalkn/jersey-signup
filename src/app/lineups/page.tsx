import { createClient } from '@supabase/supabase-js'
import LineupsBoard from '@/components/lineups/LineupsBoard'
import TopNav from '@/components/TopNav'
import type {
  JerseySignup,
  Lineup,
  LineupSlot,
  LineupSub,
} from '@/lib/supabase'

export const revalidate = 0

async function getInitialData(): Promise<{
  signups: JerseySignup[]
  lineups: Lineup[]
  slots: LineupSlot[]
  subs: LineupSub[]
}> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [signupsRes, lineupsRes, slotsRes, subsRes] = await Promise.all([
    supabase.from('jersey_signups').select('*').order('jersey_number', { ascending: true }),
    supabase.from('lineups').select('*').order('updated_at', { ascending: false }),
    supabase.from('lineup_slots').select('*'),
    supabase.from('lineup_subs').select('*'),
  ])

  if (signupsRes.error) console.error('signups:', signupsRes.error.message)
  if (lineupsRes.error) console.error('lineups:', lineupsRes.error.message)
  if (slotsRes.error)   console.error('slots:',   slotsRes.error.message)
  if (subsRes.error)    console.error('subs:',    subsRes.error.message)

  return {
    signups: signupsRes.data ?? [],
    lineups: lineupsRes.data ?? [],
    slots: slotsRes.data ?? [],
    subs: subsRes.data ?? [],
  }
}

export default async function LineupsPage() {
  const { signups, lineups, slots, subs } = await getInitialData()

  return (
    <main className="min-h-screen bg-gradient-to-b from-praxis-black via-praxis-navy to-praxis-deep pb-10 px-4">
      <TopNav />
      <div className="max-w-5xl mx-auto pt-8">
        <div className="mb-6">
          <h1 className="font-display italic uppercase text-4xl text-white tracking-wide">
            Lineups
          </h1>
          <p className="text-slate-400 mt-2 text-sm">Plan formations and sub coverage before the match</p>
        </div>

        <LineupsBoard
          initialSignups={signups}
          initialLineups={lineups}
          initialSlots={slots}
          initialSubs={subs}
        />
      </div>
    </main>
  )
}
