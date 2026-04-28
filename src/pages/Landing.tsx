import { Link } from 'react-router-dom'
import { ArrowRight, Users, Zap, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="border-b border-slate-100 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <span className="font-display text-2xl font-bold text-navy-800">
            bench<span className="text-bip-red">.</span>
          </span>
          <Link to="/login">
            <Button size="sm">Sign in</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-navy-800 py-24 text-white">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <div className="mb-6 inline-flex items-center rounded-full bg-navy-700 px-4 py-1.5 text-sm text-slate-300">
            Smart Staffing by Bip Consulting
          </div>
          <h1 className="font-display mb-6 text-5xl font-bold leading-tight md:text-6xl">
            The right consultant,<br />on the right project.
          </h1>
          <p className="mb-10 text-lg text-slate-300 md:text-xl">
            bench<span className="text-bip-red font-bold">.</span> intelligently matches your consulting team to projects using skills, availability, and interest signals — so no one sits idle.
          </p>
          <Link to="/login">
            <Button size="lg" variant="red" className="gap-2">
              Get started <ArrowRight size={18} />
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-xl border border-slate-100 p-8 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-navy-800">
                <Zap className="text-white" size={22} />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-navy-800">AI-Powered Matching</h3>
              <p className="text-slate-500">
                Our algorithm scores consultants by skills overlap, availability, seniority fit, and expressed interest — giving HR ranked suggestions instantly.
              </p>
            </div>

            <div className="rounded-xl border border-slate-100 p-8 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-bip-red">
                <Users className="text-white" size={22} />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-navy-800">Consultant Self-Service</h3>
              <p className="text-slate-500">
                Consultants view their assignments, browse the project pipeline, express interest in upcoming work, and request time off — all in one place.
              </p>
            </div>

            <div className="rounded-xl border border-slate-100 p-8 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-navy-800">
                <BarChart3 className="text-white" size={22} />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-navy-800">Staffing Analytics</h3>
              <p className="text-slate-500">
                Track utilization rates, bench time, and staffing velocity. Know who's available, who's rolling off, and where the gaps are before they become problems.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8 text-center text-sm text-slate-400">
        © {new Date().getFullYear()} Bip Consulting Colombia — bench<span className="text-bip-red font-bold">.</span>
      </footer>
    </div>
  )
}
