'use client'

import { useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { MapPin, DollarSign, Building2, ChevronDown, ChevronUp, RefreshCw, Sparkles, ExternalLink, Copy, Check, List, Map, Upload, X, Loader2 } from 'lucide-react'
import { VERTICAL_COLORS } from '@/lib/types'
import type { Intel, Contact } from '@/lib/types'

const TerritoryMap = dynamic(() => import('./territory-map'), { ssr: false })

interface Account {
  rank: number
  company: string
  vertical: string
  vertical_id: string
  revenue: string
  hq_city: string
  hq_state: string
  lat: number
  lng: number
  security_challenge: string
  tines_fit: string
  entry_strategy: string
  key_personas: string[]
  est_acv: string
}

const DEFAULT_ACCOUNTS: Account[] = [
  {
    rank: 1,
    company: 'JPMorgan Chase',
    vertical: 'Financial Services',
    vertical_id: 'finserv',
    revenue: '$162B',
    hq_city: 'New York',
    hq_state: 'NY',
    lat: 40.7128,
    lng: -74.006,
    security_challenge: 'Massive SOC handling thousands of daily alerts across trading, corporate, and retail banking. Manual triage creating bottlenecks. Multiple SIEM instances with fragmented response playbooks.',
    tines_fit: 'Tines automates alert triage across all SIEM sources without per-action limits. No-code stories let SOC analysts build and modify playbooks without engineering support. Cases module centralizes incident tracking.',
    entry_strategy: 'Enter through Cybersecurity Operations team. Lead with alert fatigue reduction metrics. Reference financial services peer wins. Position against legacy SOAR limitations.',
    key_personas: ['CISO', 'VP Cybersecurity Operations', 'SOC Director', 'Head of Security Engineering'],
    est_acv: '$400K - $800K',
  },
  {
    rank: 2,
    company: 'Northrop Grumman',
    vertical: 'Government / Defense',
    vertical_id: 'government',
    revenue: '$39B',
    hq_city: 'Falls Church',
    hq_state: 'VA',
    lat: 38.882,
    lng: -77.171,
    security_challenge: 'Defense contractor with classified and unclassified security operations. Manual incident response across multiple security enclaves. Compliance with CMMC 2.0 and NIST 800-171.',
    tines_fit: 'Tines deploys on-prem for classified environments. No-code automation satisfies CMMC compliance documentation requirements. Workflow automation reduces mean time to respond across security enclaves.',
    entry_strategy: 'Target Cyber division security operations. Lead with compliance automation for CMMC 2.0. Position through cleared integrator relationships.',
    key_personas: ['VP Cyber & Intelligence', 'CISO', 'Director Security Operations', 'CMMC Compliance Lead'],
    est_acv: '$300K - $600K',
  },
  {
    rank: 3,
    company: 'UnitedHealth Group',
    vertical: 'Healthcare',
    vertical_id: 'healthcare',
    revenue: '$372B',
    hq_city: 'Minnetonka',
    hq_state: 'MN',
    lat: 44.9133,
    lng: -93.4687,
    security_challenge: 'Post-Change Healthcare breach, massive security overhaul underway. HIPAA compliance automation needed across Optum and UHC entities. Thousands of endpoints with manual patching workflows.',
    tines_fit: 'Tines automates HIPAA compliance workflows and breach notification processes. No-code stories enable security team to build PHI incident response without engineering backlog. Cases tracks every compliance action.',
    entry_strategy: 'Enter through CISO office post-breach security investment cycle. Lead with compliance automation and incident response speed. Reference healthcare peer deployments.',
    key_personas: ['CISO', 'VP Security Operations', 'Director IT Security - Optum', 'HIPAA Security Officer'],
    est_acv: '$500K - $1M',
  },
  {
    rank: 4,
    company: 'CrowdStrike',
    vertical: 'Technology',
    vertical_id: 'technology',
    revenue: '$3.4B',
    hq_city: 'Austin',
    hq_state: 'TX',
    lat: 30.2672,
    lng: -97.7431,
    security_challenge: 'Rapid growth creating internal security ops scaling challenges. Dogfooding their own Falcon platform but need automation layer for cross-tool orchestration beyond EDR.',
    tines_fit: 'Tines sits above CrowdStrike Falcon as the orchestration layer, automating cross-tool workflows. No-code means their security team scales automation without pulling from product engineering. Partner opportunity.',
    entry_strategy: 'Enter as both customer and potential technology partner. Target internal security operations team. Lead with cross-tool orchestration value above Falcon.',
    key_personas: ['CISO', 'VP Internal Security', 'Director Security Operations', 'Head of Technology Partnerships'],
    est_acv: '$250K - $500K + partnership',
  },
  {
    rank: 5,
    company: 'Duke Energy',
    vertical: 'Critical Infrastructure',
    vertical_id: 'infrastructure',
    revenue: '$29B',
    hq_city: 'Charlotte',
    hq_state: 'NC',
    lat: 35.2271,
    lng: -80.8431,
    security_challenge: 'Critical infrastructure protecting power grid across 6 states. NERC CIP compliance requires documented security response procedures. OT/IT convergence creating new attack surfaces.',
    tines_fit: 'Tines automates NERC CIP compliance evidence collection and incident response documentation. No-code workflows bridge OT and IT security operations. Pages module enables self-service security reporting.',
    entry_strategy: 'Target OT security team. Lead with NERC CIP compliance automation. Position as bridge between IT and OT security operations.',
    key_personas: ['VP Cybersecurity', 'Director OT Security', 'NERC CIP Compliance Manager', 'CISO'],
    est_acv: '$300K - $600K',
  },
  {
    rank: 6,
    company: 'Goldman Sachs',
    vertical: 'Financial Services',
    vertical_id: 'finserv',
    revenue: '$47B',
    hq_city: 'New York',
    hq_state: 'NY',
    lat: 40.7146,
    lng: -74.0071,
    security_challenge: 'Elite security team drowning in alert volume from proprietary trading systems. Custom-built automation is brittle and engineer-dependent. SEC and FINRA compliance creating documentation burden.',
    tines_fit: 'Tines replaces custom Python scripts with maintainable no-code workflows. Unlimited runs handle the high alert volume without cost scaling. Cases module satisfies SEC incident documentation requirements.',
    entry_strategy: 'Target security engineering team. Lead with replacing custom automation scripts. Position against build-vs-buy TCO argument.',
    key_personas: ['CISO', 'Head of Security Engineering', 'VP Technology Risk', 'Director SOC Operations'],
    est_acv: '$300K - $600K',
  },
  {
    rank: 7,
    company: 'HCA Healthcare',
    vertical: 'Healthcare',
    vertical_id: 'healthcare',
    revenue: '$65B',
    hq_city: 'Nashville',
    hq_state: 'TN',
    lat: 36.1627,
    lng: -86.7816,
    security_challenge: '180+ hospitals with decentralized security operations. Alert fatigue across hundreds of facilities. Manual compliance workflows for HIPAA and state regulations.',
    tines_fit: 'Tines centralizes security automation across all hospital facilities with standardized stories. No per-action pricing means scaling to 180+ sites stays affordable. Pages enables facility-level security intake.',
    entry_strategy: 'Enter through enterprise security operations. Lead with centralized automation across distributed facilities. Reference healthcare compliance automation wins.',
    key_personas: ['CISO', 'VP Enterprise Security', 'Director Security Operations', 'Chief Compliance Officer'],
    est_acv: '$400K - $800K',
  },
  {
    rank: 8,
    company: 'Lockheed Martin',
    vertical: 'Government / Defense',
    vertical_id: 'government',
    revenue: '$67B',
    hq_city: 'Bethesda',
    hq_state: 'MD',
    lat: 38.9848,
    lng: -77.0947,
    security_challenge: 'Multi-program classified security operations. CMMC compliance across all defense contracts. Supply chain security monitoring across thousands of subcontractors.',
    tines_fit: 'Tines on-prem deployment for classified networks. Automated CMMC compliance evidence collection. Supply chain security alerting workflows monitor subcontractor risk signals.',
    entry_strategy: 'Target Cyber & Intelligence division. Lead with CMMC compliance automation across programs. Reference defense sector peer deployments.',
    key_personas: ['VP Cyber Solutions', 'CISO', 'Director Cybersecurity Operations', 'CMMC Program Manager'],
    est_acv: '$350K - $700K',
  },
  {
    rank: 9,
    company: 'Snowflake',
    vertical: 'Technology',
    vertical_id: 'technology',
    revenue: '$3.4B',
    hq_city: 'Bozeman',
    hq_state: 'MT',
    lat: 45.6770,
    lng: -111.0429,
    security_challenge: 'Rapid growth post-breach notification. Rebuilding security operations with modern tooling. Need to automate customer notification workflows and compliance reporting.',
    tines_fit: 'Tines is already used by Snowflake (reference customer). Expansion opportunity into additional security use cases. Cases module for incident tracking, Pages for customer-facing security status.',
    entry_strategy: 'Expand from existing footprint. Target security operations leadership for broader deployment. Lead with expansion use cases beyond initial deployment.',
    key_personas: ['CISO', 'VP Security Operations', 'Head of Security Engineering', 'Director Compliance'],
    est_acv: '$200K - $400K (expansion)',
  },
  {
    rank: 10,
    company: 'Deloitte',
    vertical: 'Enterprise',
    vertical_id: 'enterprise',
    revenue: '$65B',
    hq_city: 'New York',
    hq_state: 'NY',
    lat: 40.7558,
    lng: -73.9845,
    security_challenge: 'Internal SOC managing security across global consulting practice. Client-facing managed security services needing automation backbone. Tool sprawl across practices.',
    tines_fit: 'Tines serves as both internal SOC automation and client-facing MSSP platform. No-code enables consultants to build client-specific workflows. Explore SI partnership for Tines implementation services.',
    entry_strategy: 'Enter as customer AND partner. Target internal CISO office and Cyber practice leadership. Lead with dual value of internal automation plus client delivery.',
    key_personas: ['Global CISO', 'US Cyber Practice Leader', 'Director Internal SOC', 'Managing Director - Managed Security'],
    est_acv: '$300K - $600K + partner revenue',
  },
]

/* ── City coordinate lookup for imported accounts ── */

const CITY_COORDS: Record<string, [number, number]> = {
  'new york': [40.7128, -74.006], 'los angeles': [34.0522, -118.2437],
  'chicago': [41.8781, -87.6298], 'houston': [29.7604, -95.3698],
  'phoenix': [33.4484, -112.074], 'philadelphia': [39.9526, -75.1652],
  'san antonio': [29.4241, -98.4936], 'san diego': [32.7157, -117.1611],
  'dallas': [32.7767, -96.797], 'san jose': [37.3382, -121.8863],
  'austin': [30.2672, -97.7431], 'jacksonville': [30.3322, -81.6557],
  'san francisco': [37.7749, -122.4194], 'seattle': [47.6062, -122.3321],
  'denver': [39.7392, -104.9903], 'boston': [42.3601, -71.0589],
  'washington': [38.9072, -77.0369], 'nashville': [36.1627, -86.7816],
  'atlanta': [33.749, -84.388], 'detroit': [42.3314, -83.0458],
  'miami': [25.7617, -80.1918], 'portland': [45.5152, -122.6784],
  'charlotte': [35.2271, -80.8431], 'minneapolis': [44.9778, -93.265],
  'raleigh': [35.7796, -78.6382], 'salt lake city': [40.7608, -111.891],
  'st louis': [38.627, -90.1994], 'pittsburgh': [40.4406, -79.9959],
  'columbus': [39.9612, -82.9988], 'indianapolis': [39.7684, -86.1581],
  'tampa': [27.9506, -82.4572], 'richmond': [37.5407, -77.436],
  'omaha': [41.2565, -95.9345], 'kansas city': [39.0997, -94.5786],
  'milwaukee': [43.0389, -87.9065], 'louisville': [38.2527, -85.7585],
  'oklahoma city': [35.4676, -97.5164], 'memphis': [35.1495, -90.049],
  'baltimore': [39.2904, -76.6122], 'cincinnati': [39.1031, -84.512],
  'bethesda': [38.9848, -77.0947], 'arlington': [38.8799, -77.1068],
  'cupertino': [37.323, -122.0322], 'redmond': [47.674, -122.1215],
  'menlo park': [37.453, -122.1817], 'mountain view': [37.3861, -122.0839],
  'palo alto': [37.4419, -122.143], 'new brunswick': [40.4862, -74.4518],
  'minnetonka': [44.9133, -93.4687], 'spring': [30.0799, -95.4172],
  'iselin': [40.5728, -74.3224], 'evendale': [39.2328, -84.426],
  'stamford': [41.0534, -73.5387], 'bentonville': [36.3729, -94.2088],
  'irving': [32.814, -96.9489], 'round rock': [30.5083, -97.6789],
  'armonk': [41.1265, -73.7143], 'purchase': [41.0409, -73.7143],
  'dearborn': [42.3223, -83.1763], 'burbank': [34.1808, -118.3090],
  'sunnyvale': [37.3688, -122.0363], 'plano': [33.0198, -96.6989],
  'troy': [42.6064, -83.1498], 'wilmington': [39.7391, -75.5398],
  'hartford': [41.7658, -72.6734], 'providence': [41.824, -71.4128],
  'buffalo': [42.8864, -78.8784], 'rochester': [43.1566, -77.6088],
  'cleveland': [41.4993, -81.6944], 'orlando': [28.5383, -81.3792],
  'las vegas': [36.1699, -115.1398], 'tucson': [32.2226, -110.9747],
  'falls church': [38.882, -77.171], 'bozeman': [45.6770, -111.0429],
}

function lookupCoords(city: string): { lat: number; lng: number } {
  if (!city) return { lat: 0, lng: 0 }
  const coords = CITY_COORDS[city.toLowerCase().trim()]
  return coords ? { lat: coords[0], lng: coords[1] } : { lat: 0, lng: 0 }
}

function mapVerticalId(vertical: string): string {
  const l = vertical.toLowerCase()
  if (l.includes('financial') || l.includes('banking') || l.includes('insurance')) return 'finserv'
  if (l.includes('health') || l.includes('pharma') || l.includes('medical')) return 'healthcare'
  if (l.includes('technology') || l.includes('software') || l.includes('saas')) return 'technology'
  if (l.includes('government') || l.includes('defense') || l.includes('federal')) return 'government'
  if (l.includes('energy') || l.includes('utility') || l.includes('telecom') || l.includes('infrastructure')) return 'infrastructure'
  return 'enterprise'
}

function linkedinUrl(persona: string, company: string) {
  return `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(persona + ' ' + company)}`
}

export default function TerritoryPlan() {
  const [expandedAccount, setExpandedAccount] = useState<number | null>(null)
  const [researching, setResearching] = useState<Record<number, boolean>>({})
  const [deepDive, setDeepDive] = useState<Record<number, Intel>>({})
  const [copied, setCopied] = useState<string | null>(null)

  // Map / list toggle
  const [view, setView] = useState<'list' | 'map'>('list')

  // Import
  const [showImport, setShowImport] = useState(false)
  const [importText, setImportText] = useState('')
  const [importing, setImporting] = useState(false)
  const [importProgress, setImportProgress] = useState<Record<string, 'pending' | 'loading' | 'done' | 'error'>>({})
  const [importedAccounts, setImportedAccounts] = useState<Account[]>([])
  const [includeDefaults, setIncludeDefaults] = useState(true)

  const allAccounts = useMemo(() => {
    const base = includeDefaults ? DEFAULT_ACCOUNTS : []
    return [...base, ...importedAccounts].map((a, i) => ({ ...a, rank: i + 1 }))
  }, [includeDefaults, importedAccounts])

  const totalPipeline = allAccounts.reduce((s, a) => {
    const match = a.est_acv.match(/\$([0-9.]+)([KMB])/i)
    if (!match) return s
    const num = parseFloat(match[1])
    const mult = match[2].toUpperCase() === 'M' ? 1000000 : match[2].toUpperCase() === 'K' ? 1000 : 1
    return s + num * mult
  }, 0)

  const aiResearch = async (idx: number) => {
    const account = allAccounts[idx]
    setResearching(p => ({ ...p, [idx]: true }))
    try {
      const r = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company: account.company }),
      })
      const d = await r.json()
      if (d.intel) {
        setDeepDive(p => ({ ...p, [idx]: d.intel as Intel }))
      }
    } catch {}
    setResearching(p => ({ ...p, [idx]: false }))
  }

  const parseImportLine = (line: string) => {
    const parts = line.split(',').map(s => s.trim())
    const company = parts[0]
    if (parts.length >= 3) {
      // "Company, City, ST" or "Company, City, ST ZIP"
      const city = parts[1]
      const stateChunk = parts.slice(2).join(', ').trim()
      const stateMatch = stateChunk.match(/^([A-Z]{2})(?:\s+\d{5})?$/i)
      const state = stateMatch ? stateMatch[1].toUpperCase() : stateChunk.replace(/\s*\d{5}$/, '').trim()
      return { company, city, state }
    }
    if (parts.length === 2) {
      // Could be "Company, City" — no state
      return { company, city: parts[1], state: '' }
    }
    return { company, city: '', state: '' }
  }

  const importAccounts = async () => {
    const lines = importText.split('\n').map(s => s.trim()).filter(Boolean)
    if (!lines.length) return

    setImporting(true)
    const progress: Record<string, 'pending' | 'loading' | 'done' | 'error'> = {}
    lines.forEach(l => { progress[l] = 'pending' })
    setImportProgress({ ...progress })

    for (const line of lines) {
      const parsed = parseImportLine(line)
      setImportProgress(p => ({ ...p, [line]: 'loading' }))
      try {
        const r = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ company: parsed.company }),
        })
        const d = await r.json()
        if (d.intel) {
          const intel = d.intel as Intel
          // Use user-provided location if given, otherwise fall back to API response
          let city = parsed.city
          let state = parsed.state
          if (!city) {
            const apiParts = (intel.hq || '').split(',').map(s => s.trim())
            city = apiParts[0] || ''
            state = apiParts[1] || ''
          }
          const coords = lookupCoords(city)
          const newAccount: Account = {
            rank: 0,
            company: intel.company_name || parsed.company,
            vertical: intel.primary_vertical || 'Technology',
            vertical_id: mapVerticalId(intel.primary_vertical || ''),
            revenue: '',
            hq_city: city,
            hq_state: state,
            lat: coords.lat,
            lng: coords.lng,
            security_challenge: intel.security_challenge || '',
            tines_fit: intel.tines_fit || '',
            entry_strategy: intel.outreach_angle || '',
            key_personas: intel.target_contacts?.map(c => c.title) || [],
            est_acv: 'TBD',
          }
          setImportedAccounts(prev => [...prev, newAccount])
          setImportProgress(p => ({ ...p, [line]: 'done' }))
        } else {
          setImportProgress(p => ({ ...p, [line]: 'error' }))
        }
      } catch {
        setImportProgress(p => ({ ...p, [line]: 'error' }))
      }
    }
    setImporting(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">Territory Attack Plan - Q2 2026</h2>
          <p className="text-sm text-tines-muted">
            {allAccounts.length} pre-researched enterprise accounts with security automation challenges aligned to Tines&apos; ICP
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Import toggle */}
          <button
            onClick={() => setShowImport(p => !p)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              showImport
                ? 'bg-tines/15 text-tines-light border border-tines/25'
                : 'bg-surface-raised text-tines-muted border border-surface-border hover:bg-tines/5 hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Import
          </button>

          {/* View toggle */}
          <div className="flex rounded-lg border border-surface-border overflow-hidden">
            <button
              onClick={() => setView('list')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-all ${
                view === 'list' ? 'bg-tines/10 text-white' : 'text-tines-muted hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              List
            </button>
            <button
              onClick={() => setView('map')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-all ${
                view === 'map' ? 'bg-tines/10 text-white' : 'text-tines-muted hover:text-white'
              }`}
            >
              <Map className="w-3.5 h-3.5" />
              Map
            </button>
          </div>
        </div>
      </div>

      {/* Import Panel */}
      {showImport && (
        <div className="p-5 rounded-xl bg-surface-raised border border-surface-border space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Import Accounts</h3>
              <p className="text-xs text-tines-muted mt-0.5">Paste one entry per line. Use company name alone, or add location: Company, City, ST or Company, City, ST ZIP</p>
            </div>
            <button onClick={() => setShowImport(false)} className="p-1 text-tines-dim hover:text-[#C8C0E0]">
              <X className="w-4 h-4" />
            </button>
          </div>

          <textarea
            value={importText}
            onChange={e => setImportText(e.target.value)}
            placeholder={'JPMorgan Chase\nBoeing, Arlington, VA 22202\nExxonMobil, Spring, TX 77389\nSnowflake'}
            rows={5}
            className="w-full px-4 py-3 rounded-xl bg-surface-raised border border-surface-border text-white placeholder-tines-dim focus:outline-none focus:border-tines/40 text-sm resize-none leading-relaxed"
          />

          <div className="flex items-center gap-4">
            <button
              onClick={importAccounts}
              disabled={importing || !importText.trim()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-tines text-white font-medium text-sm hover:bg-tines-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {importing ? (
                <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Importing...</>
              ) : (
                <><Upload className="w-3.5 h-3.5" /> Import Accounts</>
              )}
            </button>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <button
                onClick={() => setIncludeDefaults(p => !p)}
                className={`relative w-9 h-5 rounded-full transition-colors ${includeDefaults ? 'bg-tines' : 'bg-white/10'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${includeDefaults ? 'translate-x-4' : ''}`} />
              </button>
              <span className="text-xs text-tines-muted">Include default accounts</span>
            </label>
          </div>

          {/* Import progress */}
          {Object.keys(importProgress).length > 0 && (
            <div className="space-y-1.5">
              {Object.entries(importProgress).map(([name, status]) => (
                <div key={name} className="flex items-center gap-2 text-xs">
                  {status === 'pending' && <div className="w-3.5 h-3.5 rounded-full border border-tines-dim" />}
                  {status === 'loading' && <Loader2 className="w-3.5 h-3.5 text-tines animate-spin" />}
                  {status === 'done' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  {status === 'error' && <X className="w-3.5 h-3.5 text-red-400" />}
                  <span className={status === 'done' ? 'text-[#C8C0E0]' : status === 'error' ? 'text-red-400' : 'text-tines-muted'}>
                    {name}
                  </span>
                  {status === 'loading' && <span className="text-tines-dim">Analyzing...</span>}
                  {status === 'error' && <span className="text-red-500">Failed</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-surface-raised border border-surface-border">
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-4 h-4 text-tines" />
            <span className="text-xs text-tines-muted">Target Accounts</span>
          </div>
          <div className="text-2xl font-bold text-white">{allAccounts.length}</div>
        </div>
        <div className="p-4 rounded-xl bg-surface-raised border border-surface-border">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-tines-muted">Pipeline Target (Low)</span>
          </div>
          <div className="text-2xl font-bold text-white">${(totalPipeline / 1000000).toFixed(1)}M</div>
        </div>
        <div className="p-4 rounded-xl bg-surface-raised border border-surface-border">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-4 h-4 text-tines" />
            <span className="text-xs text-tines-muted">Verticals Covered</span>
          </div>
          <div className="text-2xl font-bold text-white">{new Set(allAccounts.map(a => a.vertical_id)).size}</div>
        </div>
      </div>

      {/* Map View */}
      {view === 'map' && (
        <TerritoryMap accounts={allAccounts} />
      )}

      {/* Account List */}
      {view === 'list' && (
        <div className="space-y-2">
          {allAccounts.map((a, idx) => {
            const isOpen = expandedAccount === idx
            return (
              <div key={`${a.company}-${idx}`} className="rounded-xl bg-surface-raised border border-surface-border overflow-hidden hover:border-tines/15 transition-all">
                <button
                  onClick={() => setExpandedAccount(isOpen ? null : idx)}
                  className="w-full p-4 flex items-center gap-4 text-left"
                >
                  <span className="w-7 h-7 rounded-lg bg-surface-raised flex items-center justify-center text-xs font-bold text-tines-muted">
                    {a.rank}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-white">{a.company}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${VERTICAL_COLORS[a.vertical_id] || 'bg-surface-raised text-tines-muted'}`}>
                        {a.vertical}
                      </span>
                      {a.revenue && <span className="text-xs text-tines-dim">{a.revenue}</span>}
                      {a.hq_city && (
                        <span className="text-xs text-tines-dim flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {a.hq_city}, {a.hq_state}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-mono text-emerald-400">{a.est_acv}</span>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-tines-muted" /> : <ChevronDown className="w-4 h-4 text-tines-muted" />}
                </button>

                {isOpen && (
                  <div className="border-t border-surface-border p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                        <div className="text-[10px] uppercase tracking-wider text-red-400 mb-1">Security Challenge</div>
                        <p className="text-xs text-[#C8C0E0]">{a.security_challenge}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-tines/5 border border-tines/10">
                        <div className="text-[10px] uppercase tracking-wider text-tines mb-1">Tines Fit</div>
                        <p className="text-xs text-[#C8C0E0]">{a.tines_fit}</p>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-tines/5 border border-tines/10">
                      <div className="text-[10px] uppercase tracking-wider text-tines mb-1">Entry Strategy</div>
                      <p className="text-xs text-[#C8C0E0]">{a.entry_strategy}</p>
                    </div>

                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-tines-muted mb-2">Key Personas</div>
                      <div className="flex flex-wrap gap-2">
                        {a.key_personas.map((p, i) => (
                          <a
                            key={i}
                            href={linkedinUrl(p, a.company)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-surface-raised text-xs text-tines-light hover:bg-tines/10 hover:text-tines-light transition-all"
                          >
                            {p}
                            <ExternalLink className="w-3 h-3 opacity-60" />
                          </a>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => aiResearch(idx)}
                      disabled={researching[idx]}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-tines/10 text-tines hover:bg-tines/15 transition-all text-xs font-medium"
                    >
                      {researching[idx] ? (
                        <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Researching...</>
                      ) : (
                        <><Sparkles className="w-3.5 h-3.5" /> AI Deep Dive</>
                      )}
                    </button>

                    {deepDive[idx] && (() => {
                      const intel = deepDive[idx]
                      return (
                        <div className="space-y-3">
                          {/* Relevance Score */}
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-2 rounded-full bg-white/10 overflow-hidden">
                                <div className="h-full rounded-full bg-tines" style={{ width: `${intel.relevance_score}%` }} />
                              </div>
                              <span className="text-xs text-tines font-mono">{intel.relevance_score}%</span>
                            </div>
                            <span className="text-[10px] text-tines-muted">{intel.relevance_label}</span>
                            {intel.hq && <span className="text-[10px] text-tines-dim">HQ: {intel.hq}</span>}
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                              <div className="text-[10px] uppercase tracking-wider text-red-400 mb-1">Security Challenge</div>
                              <p className="text-xs text-[#C8C0E0]">{intel.security_challenge}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-tines/5 border border-tines/10">
                              <div className="text-[10px] uppercase tracking-wider text-tines mb-1">Tines Fit</div>
                              <p className="text-xs text-[#C8C0E0]">{intel.tines_fit}</p>
                            </div>
                          </div>

                          <div className="p-3 rounded-lg bg-tines/5 border border-tines/10">
                            <div className="text-[10px] uppercase tracking-wider text-tines mb-1">Outreach Angle</div>
                            <p className="text-xs text-[#C8C0E0]">{intel.outreach_angle}</p>
                          </div>

                          {intel.talking_points?.length > 0 && (
                            <div className="p-3 rounded-lg bg-surface-raised">
                              <div className="text-[10px] uppercase tracking-wider text-tines-muted mb-2">Talking Points</div>
                              <ul className="space-y-1">
                                {intel.talking_points.map((pt: string, pi: number) => (
                                  <li key={pi} className="flex items-start gap-2 text-xs text-[#C8C0E0]">
                                    <span className="text-tines mt-0.5">&rarr;</span> {pt}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {intel.target_contacts?.length > 0 && (
                            <div>
                              <div className="text-[10px] uppercase tracking-wider text-tines-muted mb-2">Target Contacts</div>
                              <div className="flex flex-wrap gap-2">
                                {intel.target_contacts.map((c: Contact, ci: number) => (
                                  <a key={ci} href={c.linkedin_search} target="_blank" rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-surface-raised text-xs text-tines-light hover:bg-tines/10 hover:text-tines-light transition-all"
                                    title={c.why_target}>
                                    {c.title} <ExternalLink className="w-3 h-3 opacity-60" />
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}

                          {intel.risk_flags?.length > 0 && (
                            <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
                              <div className="text-[10px] uppercase tracking-wider text-amber-400 mb-1">Risk Factors</div>
                              <ul className="space-y-1">
                                {intel.risk_flags.map((rf: string, ri: number) => (
                                  <li key={ri} className="text-xs text-tines-muted flex items-start gap-2">
                                    <span className="text-amber-500 mt-0.5">!</span> {rf}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {intel.email_subject && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(`Subject: ${intel.email_subject}\n\n${intel.outreach_angle}`)
                                  setCopied(`dd-${idx}`)
                                  setTimeout(() => setCopied(null), 2000)
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-raised text-xs text-[#C8C0E0] hover:bg-tines/5 transition-all"
                              >
                                {copied === `dd-${idx}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                {copied === `dd-${idx}` ? 'Copied' : 'Copy outreach'}
                              </button>
                              <span className="text-[10px] text-tines-dim truncate">Subject: {intel.email_subject}</span>
                            </div>
                          )}
                        </div>
                      )
                    })()}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
