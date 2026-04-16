'use client'

import { useState, useEffect } from 'react'
import { Radio, MessageSquare, Map, Network, Shield, ShieldCheck, Target } from 'lucide-react'
import SignalFeed from '@/components/signal-feed'
import SalesAssist from '@/components/sales-assist'
import TerritoryPlan from '@/components/territory-plan'
import KnowledgeGraph from '@/components/knowledge-graph'
import MeddpiccBuilder from '@/components/meddpicc-builder'

/* ── Inline Tines logo mark (no external dependency) ── */
function TinesLogo() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="flex-shrink-0">
      <circle cx="16" cy="16" r="16" fill="#7C5CFC"/>
      <path d="M10.5 12.5C10.5 10.84 11.84 9.5 13.5 9.5h5c1.66 0 3 1.34 3 3v1h-11v-1z" fill="white"/>
      <rect x="10.5" y="14" width="11" height="2" rx="0.5" fill="white" fillOpacity="0.9"/>
      <rect x="10.5" y="17" width="11" height="2" rx="0.5" fill="white" fillOpacity="0.9"/>
      <path d="M10.5 19.5h11v1c0 1.66-1.34 3-3 3h-5c-1.66 0-3-1.34-3-3v-1z" fill="white" fillOpacity="0.8"/>
    </svg>
  )
}

const TABS = [
  { id: 'signals', label: 'Signal Feed', Icon: Radio },
  { id: 'sales-assist', label: 'Sales Assist', Icon: MessageSquare },
  { id: 'meddpicc', label: 'MEDDPICC', Icon: Target },
  { id: 'territory', label: 'Territory Plan', Icon: Map },
]

const ADMIN_TAB = { id: 'graph', label: 'Knowledge Graph', Icon: Network }

export default function Dashboard() {
  const [tab, setTab] = useState('signals')
  const [admin, setAdmin] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'G') {
        e.preventDefault()
        setAdmin(p => !p)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const visibleTabs = admin ? [...TABS, ADMIN_TAB] : TABS

  return (
    <div className="min-h-screen bg-surface text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-surface-border bg-surface/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TinesLogo />
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-white">Tines Lead Intel</h1>
              <p className="text-xs text-tines-muted">Pre-Interview Account Intelligence</p>
              <span className="inline-block mt-1 px-2 py-0.5 text-[9px] font-medium tracking-wide uppercase text-tines-light/70 border border-tines/15 rounded-full bg-tines/5">
                Built for Tines Senior Enterprise AE Interview
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {admin && (
              <span className="px-2 py-1 text-[10px] font-bold tracking-widest uppercase bg-tines/10 text-tines-light border border-tines/20 rounded-md">
                Architect Mode
              </span>
            )}
            <div className="flex items-center gap-2 text-xs text-tines-muted">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </div>
            <button
              onClick={() => setAdmin(p => !p)}
              className={`p-2 rounded-lg transition-all ${
                admin
                  ? 'bg-tines/15 text-tines-light'
                  : 'text-tines-dim hover:text-tines-muted hover:bg-tines/5'
              }`}
              title="Toggle Architect Mode (Ctrl+Shift+G)"
            >
              {admin ? <ShieldCheck className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex gap-1 -mb-px">
            {visibleTabs.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                  tab === id
                    ? id === 'graph'
                      ? 'border-tines-light text-tines-light'
                      : 'border-tines text-white'
                    : 'border-transparent text-tines-dim hover:text-tines-muted hover:border-tines/20'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {tab === 'signals' && <SignalFeed />}
        {tab === 'sales-assist' && <SalesAssist />}
        {tab === 'meddpicc' && <MeddpiccBuilder />}
        {tab === 'territory' && <TerritoryPlan />}
        {tab === 'graph' && admin && <KnowledgeGraph />}
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 pb-6 pt-2">
        <p className="text-center text-[11px] text-tines-dim">
          Prepared by Max Aldinger for Tines &middot; April 2026
        </p>
      </footer>
    </div>
  )
}
