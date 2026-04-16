'use client'

import { useState, useEffect, useRef } from 'react'
import { Building2, ChevronDown, Search, Zap } from 'lucide-react'

interface Company {
  company: string
  vertical_label: string
  top_signal: string
  why_tines: string
  amount: string | null
  urgency: string
  signal_count: number
}

interface Props {
  onPick: (notes: string, dealName: string) => void
  label?: string
}

export default function SaDealPicker({ onPick, label = 'Pull from Signal Feed' }: Props) {
  const [companies, setCompanies] = useState<Company[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [q, setQ] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let alive = true
    setLoading(true)
    fetch('/api/feed')
      .then(r => r.json())
      .then(d => { if (alive) setCompanies(d.companies || []) })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = q
    ? companies.filter(c => c.company.toLowerCase().includes(q.toLowerCase()) || c.vertical_label.toLowerCase().includes(q.toLowerCase()))
    : companies

  const pick = (c: Company) => {
    const notes = [
      `Account: ${c.company}`,
      `Vertical: ${c.vertical_label}`,
      `Urgency: ${c.urgency.toUpperCase()} (${c.signal_count} signal${c.signal_count === 1 ? '' : 's'})`,
      c.amount ? `Deal Size / Signal Amount: ${c.amount}` : null,
      ``,
      `-- Latest Signal --`,
      c.top_signal,
      ``,
      `-- Why Tines Fits --`,
      c.why_tines,
    ].filter(Boolean).join('\n')
    onPick(notes, c.company)
    setOpen(false)
    setQ('')
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-tines/10 border border-tines/30 text-tines text-sm font-medium hover:bg-tines/15 transition-colors"
      >
        <Zap className="w-4 h-4" />
        {label}
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-40 mt-2 w-[420px] max-h-[420px] overflow-hidden rounded-xl bg-surface-overlay border border-surface-border shadow-2xl flex flex-col">
          <div className="p-2 border-b border-surface-border flex items-center gap-2">
            <Search className="w-4 h-4 text-tines-dim ml-1 flex-shrink-0" />
            <input
              autoFocus
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search companies from Signal Feed…"
              className="flex-1 bg-transparent text-sm text-white placeholder-tines-dim focus:outline-none"
            />
          </div>
          <div className="overflow-y-auto flex-1">
            {loading && (
              <div className="p-4 text-xs text-tines-muted text-center">Loading Signal Feed…</div>
            )}
            {!loading && filtered.length === 0 && (
              <div className="p-4 text-xs text-tines-muted text-center">
                {companies.length === 0 ? 'No companies in Signal Feed yet.' : 'No matches.'}
              </div>
            )}
            {filtered.map(c => (
              <button
                key={c.company}
                type="button"
                onClick={() => pick(c)}
                className="w-full text-left px-3 py-2.5 hover:bg-tines/5 transition-colors border-b border-surface-border/50 last:border-b-0"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Building2 className="w-3.5 h-3.5 text-tines-muted flex-shrink-0" />
                  <span className="text-sm font-medium text-white truncate">{c.company}</span>
                  <span className={`ml-auto text-[10px] uppercase px-1.5 py-0.5 rounded border flex-shrink-0 ${
                    c.urgency === 'high' ? 'text-red-300 bg-red-500/10 border-red-500/20'
                    : c.urgency === 'medium' ? 'text-yellow-300 bg-yellow-500/10 border-yellow-500/20'
                    : 'text-tines-dim bg-surface-raised border-surface-border'
                  }`}>
                    {c.urgency}
                  </span>
                </div>
                <div className="text-[11px] text-tines-muted mb-1">{c.vertical_label}</div>
                <div className="text-xs text-[#C8C0E0] line-clamp-2">{c.top_signal}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
