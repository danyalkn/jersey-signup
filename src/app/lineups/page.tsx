import LineupsBoard from '@/components/lineups/LineupsBoard'
import TopNav from '@/components/TopNav'

export default function LineupsPage() {
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

        <LineupsBoard />
      </div>
    </main>
  )
}
