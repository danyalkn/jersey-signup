import AdminTable from '@/components/AdminTable'
import TopNav from '@/components/TopNav'
import { ROSTER } from '@/lib/roster'

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-praxis-black via-praxis-navy to-praxis-deep pb-10 px-4">
      <TopNav />
      <div className="max-w-3xl mx-auto pt-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display italic uppercase text-4xl text-white tracking-wide">
            Admin
          </h1>
          <p className="text-slate-400 mt-2 text-sm">
            {ROSTER.length} players on the roster
          </p>
        </div>

        <AdminTable />
      </div>
    </main>
  )
}
