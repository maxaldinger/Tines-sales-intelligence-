import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getDb, FEED_TTL_HOURS } from '@/lib/db'

const VERTICALS = [
  { id: 'finserv', label: 'Financial Services', queries: ['financial services cybersecurity SOAR automation', 'bank security operations incident response platform', 'financial compliance security automation enterprise'] },
  { id: 'healthcare', label: 'Healthcare', queries: ['healthcare cybersecurity automation HIPAA', 'hospital security operations SOC automation', 'health system incident response compliance'] },
  { id: 'technology', label: 'Technology', queries: ['enterprise security automation SOAR platform', 'tech company SOC operations automation AI', 'SaaS security workflow automation vendor consolidation'] },
  { id: 'government', label: 'Government / Defense', queries: ['federal government cybersecurity automation', 'defense security operations SOAR platform', 'government agency incident response automation'] },
  { id: 'infrastructure', label: 'Critical Infrastructure', queries: ['critical infrastructure cybersecurity OT security', 'energy utility security automation SOAR', 'telecom security operations incident response'] },
  { id: 'enterprise', label: 'Enterprise', queries: ['enterprise SOAR platform security automation 2024', 'SOC automation alert fatigue reduction enterprise', 'security orchestration vendor consolidation enterprise'] },
]

async function fetchGoogleNews(query: string): Promise<string[]> {
  try {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`
    const r = await fetch(url, { signal: AbortSignal.timeout(8000) })
    const xml = await r.text()
    const titles: string[] = []
    const matches = xml.matchAll(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/g)
    for (const m of matches) {
      const t = m[1]?.trim()
      if (t && !t.includes('Google News') && t.length > 10) titles.push(t)
    }
    return titles.slice(0, 18)
  } catch (e: any) {
    console.error('[feed] fetchGoogleNews failed for query:', query, e.message)
    return []
  }
}

async function fetchFederalContracts(): Promise<string[]> {
  try {
    const keywords = ['cybersecurity+automation', 'security+orchestration', 'incident+response+platform', 'SOAR+security', 'SOC+automation']
    const kw = keywords[Math.floor(Math.random() * keywords.length)]
    const url = `https://api.usaspending.gov/api/v2/search/spending_by_award/?limit=6&page=1&sort=Award%20Amount&order=desc&subawards=false`
    const body = {
      filters: {
        keywords: [kw.replace(/\+/g, ' ')],
        time_period: [{ start_date: '2024-01-01', end_date: '2026-12-31' }],
      },
      fields: ['Award ID', 'Recipient Name', 'Description', 'Award Amount', 'Start Date'],
      limit: 6,
      page: 1,
      sort: 'Award Amount',
      order: 'desc',
      subawards: false,
    }
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    })
    const d = await r.json()
    return (d.results || []).map((c: any) =>
      `Federal Contract: ${c['Recipient Name']} - ${c['Description']?.slice(0, 120)} ($${(c['Award Amount'] || 0).toLocaleString()})`
    )
  } catch (e: any) {
    console.error('[feed] fetchFederalContracts failed:', e.message)
    return []
  }
}

export async function GET(req: Request) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Server configuration error: missing database credentials', companies: [] }, { status: 500 })
    }
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'Server configuration error: missing AI credentials', companies: [] }, { status: 500 })
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const { searchParams } = new URL(req.url)
    const force = searchParams.get('force') === '1'

    let db: ReturnType<typeof getDb>
    try {
      db = getDb()
    } catch (dbErr: any) {
      return NextResponse.json({ error: 'Database connection failed', companies: [] }, { status: 500 })
    }

    if (!force) {
      try {
        const { data: cached, error: cacheError } = await db
          .from('ti_feed_cache')
          .select('*')
          .order('fetched_at', { ascending: false })
          .limit(1)
          .single()

        if (cached?.companies && cached.fetched_at) {
          const age = (Date.now() - new Date(cached.fetched_at).getTime()) / 3600000
          if (age < FEED_TTL_HOURS) {
            return NextResponse.json({ companies: cached.companies, fetched_at: cached.fetched_at, cached: true })
          }
        }
      } catch {}
    }

    const allHeadlines: string[] = []
    const verticalMap: Record<string, string[]> = {}

    const fetches = VERTICALS.flatMap(v =>
      v.queries.map(async q => {
        const titles = await fetchGoogleNews(q)
        titles.forEach(t => {
          allHeadlines.push(t)
          if (!verticalMap[v.id]) verticalMap[v.id] = []
          verticalMap[v.id].push(t)
        })
      })
    )
    const contractFetch = fetchFederalContracts().then(cs => cs.forEach(c => allHeadlines.push(c)))
    await Promise.all([...fetches, contractFetch])

    if (allHeadlines.length === 0) {
      try {
        const { data: stale } = await db.from('ti_feed_cache').select('*').order('fetched_at', { ascending: false }).limit(1).single()
        if (stale?.companies) return NextResponse.json({ companies: stale.companies, fetched_at: stale.fetched_at, cached: true, stale: true })
      } catch {}
      return NextResponse.json({ error: 'No signals found and no cached data available', companies: [] }, { status: 503 })
    }

    const headlineBlock = VERTICALS.map(v =>
      `## ${v.label}\n${(verticalMap[v.id] || []).join('\n')}`
    ).join('\n\n')

    let companies: any[]
    try {
      const msg = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: `You are a sales intelligence analyst for Tines, a no-code security automation platform (SOAR). Tines helps security teams automate incident response, alert triage, and cross-tool workflows without writing code.

From these industry headlines and federal contracts, extract 15-25 companies that likely have security automation challenges Tines can solve — such as alert fatigue, manual incident response, tool sprawl, compliance gaps, or SOC scalability issues.

${headlineBlock}

## Federal Contracts
${allHeadlines.filter(h => h.startsWith('Federal Contract:')).join('\n')}

Return ONLY a JSON array. Each object:
{
  "company": "Company Name",
  "vertical_id": "finserv|healthcare|technology|government|infrastructure|enterprise",
  "vertical_label": "Full Vertical Name",
  "signal_count": number (1-5),
  "top_signal": "The key buying signal in one sentence",
  "signal_type": "news|funding|hiring|contract|partnership|earnings|research|regulation|breach|compliance",
  "urgency": "high|medium|low",
  "amount": "$X or null",
  "date": "YYYY-MM or approximate",
  "why_tines": "One sentence on why Tines specifically solves their problem"
}

Focus on organizations with large security teams, heavy tool stacks, or compliance mandates. Extract exactly 15 companies maximum. Keep why_tines and top_signal under 20 words each. Return ONLY the JSON array.`
        }]
      })

      const raw = (msg.content[0] as any).text || ''
      let json = raw
      const fenceMatch = json.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (fenceMatch) json = fenceMatch[1]
      json = json.trim()
      if (!json.startsWith('[')) {
        const arrStart = json.indexOf('[')
        if (arrStart >= 0) json = json.slice(arrStart)
      }
      if (!json.endsWith(']')) {
        const lastComplete = json.lastIndexOf('}')
        if (lastComplete > 0) json = json.slice(0, lastComplete + 1) + ']'
      }
      companies = JSON.parse(json)
    } catch (claudeErr: any) {
      try {
        const { data: stale } = await db.from('ti_feed_cache').select('*').order('fetched_at', { ascending: false }).limit(1).single()
        if (stale?.companies) return NextResponse.json({ companies: stale.companies, fetched_at: stale.fetched_at, cached: true, stale: true })
      } catch {}
      return NextResponse.json({ error: claudeErr.message || 'Feed extraction failed', companies: [] }, { status: 500 })
    }

    for (const c of companies) {
      try {
        await db.from('ti_signal_timeline').upsert(
          { company: c.company, signal_type: c.signal_type, urgency: c.urgency, signal_text: c.top_signal, signal_date: c.date },
          { onConflict: 'company,signal_text' }
        ).select()
      } catch {}
    }

    try {
      await db.from('ti_feed_cache').insert({ companies })
    } catch {}

    return NextResponse.json({ companies, fetched_at: new Date().toISOString(), cached: false })
  } catch (outerErr: any) {
    return NextResponse.json({ error: outerErr.message || 'Internal server error', companies: [] }, { status: 500 })
  }
}
