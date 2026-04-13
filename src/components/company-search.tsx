'use client'

import { useState } from 'react'
import { Search, RefreshCw, Copy, Check } from 'lucide-react'
import { Intel } from '@/lib/types'
import IntelCard from './intel-card'

const STEPS = [
  'Scanning public records...',
  'Fetching security news & contracts...',
  'Scraping company website...',
  'Running Tines fit analysis...',
  'Building intelligence brief...',
]

export default function CompanySearch() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(0)
  const [result, setResult] = useState<Intel | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const search = async () => {
    if (!query.trim()) return
    setLoading(true)
    setError('')
    setResult(null)
    setStep(0)

    const stepTimer = setInterval(() => {
      setStep(s => (s < STEPS.length - 1 ? s + 1 : s))
    }, 2800)

    try {
      const isUrl = query.includes('.') && !query.includes(' ')
      const r = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isUrl ? { company: query, domain: query } : { company: query }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Analysis failed')
      setResult(d.intel)
    } catch (e: any) {
      setError(e.message)
    } finally {
      clearInterval(stepTimer)
      setLoading(false)
    }
  }

  const copyAll = () => {
    if (!result) return
    const text = `${result.company_name} - Tines Intelligence Brief\n\nRelevance: ${result.relevance_score}/100 (${result.relevance_label})\n\n${result.snapshot}\n\nTines Fit: ${result.tines_fit}\nSecurity Challenge: ${result.security_challenge}\n\nOutreach:\nSubject: ${result.email_subject}\n${result.outreach_angle}\n\nTalking Points:\n${result.talking_points?.map(t => `- ${t}`).join('\n')}`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Company Intelligence</h2>
        <p className="text-sm text-tines-muted">Deep-dive any company. Get Tines fit assessment, buying signals, and outreach strategy.</p>
      </div>

      {/* Search Bar */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-tines-muted" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
            placeholder="Company name or website (e.g. CrowdStrike or crowdstrike.com)"
            className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-surface-raised border border-surface-border text-white placeholder-tines-dim focus:outline-none focus:border-tines/40 focus:ring-1 focus:ring-tines/15 text-sm"
          />
        </div>
        <button
          onClick={search}
          disabled={loading || !query.trim()}
          className="px-6 rounded-xl bg-tines text-white font-medium text-sm hover:bg-tines-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Analyze'}
        </button>
      </div>

      {/* Loading Steps */}
      {loading && (
        <div className="p-6 rounded-xl bg-surface-raised border border-surface-border">
          <div className="space-y-2">
            {STEPS.map((s, i) => (
              <div key={i} className={`flex items-center gap-3 text-sm transition-all duration-300 ${
                i < step ? 'text-emerald-400' : i === step ? 'text-tines' : 'text-tines-dim'
              }`}>
                {i < step ? (
                  <Check className="w-4 h-4" />
                ) : i === step ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-tines-dim" />
                )}
                {s}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/15 text-red-400 text-sm">{error}</div>
      )}

      {/* Result */}
      {result && (
        <div className="p-6 rounded-xl bg-surface-raised border border-surface-border">
          <div className="flex justify-end mb-4">
            <button onClick={copyAll} className="text-xs text-tines hover:text-tines-light flex items-center gap-1">
              {copied ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy Brief</>}
            </button>
          </div>
          <IntelCard intel={result} />
        </div>
      )}

      {/* Empty State */}
      {!loading && !result && !error && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-tines/10 flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-tines/50" />
          </div>
          <p className="text-tines-muted text-sm">Enter a company name to generate a full Tines intelligence brief</p>
          <div className="flex items-center justify-center gap-2 mt-4">
            {['CrowdStrike', 'Palo Alto Networks', 'Snowflake'].map(name => (
              <button
                key={name}
                onClick={() => { setQuery(name); }}
                className="px-3 py-1.5 rounded-lg text-xs text-tines-muted bg-surface-raised hover:bg-tines/5 transition-all"
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
