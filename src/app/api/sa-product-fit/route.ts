import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const TINES_CONTEXT = `== YOUR COMPANY CONTEXT ==
Company: Tines
Description: Tines is the leading no-code security automation platform. It enables security teams to automate any workflow — from alert triage to incident response to compliance — without writing code and with no per-action pricing.
Products/Services:
- Tines Stories: Visual, no-code workflow builder for security automation
- Tines Cases: Built-in case management for security teams
- Tines Pages: Custom forms and portals for intake, approvals, and self-service
- AI Actions: LLM-powered steps integrated natively into workflows
- Tines API: Full REST API for programmatic workflow management
Key Differentiators: Only security automation platform with true no-code (not low-code), no per-action pricing (unlimited runs), vendor-agnostic integrations, SOC2 Type II certified, used by Snowflake, Canva, Databricks, Mars, McKesson.
Target Industries: Financial Services, Healthcare, Technology, Government/Defense, Critical Infrastructure
ICP: Enterprises (1000+ employees) with mature security teams, SIEM/EDR/ITSM tool stacks, and manual triage or response processes
Competitors: Splunk SOAR, Palo Alto XSOAR, Torq, Swimlane, ServiceNow SecOps
== END CONTEXT ==`;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const notes = body.notes || '';
    const dealName = body.dealName || body.account || '';
    if (!notes?.trim()) {
      return NextResponse.json({ error: 'Notes are required' }, { status: 400 });
    }

    const systemPrompt = `You are a product-fit analyst for Tines, the no-code security automation platform. Evaluate how well Tines' products map to a prospect's needs.

${TINES_CONTEXT}`;

    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 8000,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Evaluate product fit for ${dealName || 'this prospect'} from these notes.

Notes:
${notes}

Return ONLY a JSON object with this EXACT structure:
{
  "overall_score": 0-100,
  "overall_label": "Excellent Fit" | "Strong Fit" | "Moderate Fit" | "Weak Fit",
  "overall_summary": "2-3 sentence executive summary",
  "products": [
    {
      "product": "Tines Stories",
      "score": 0-100,
      "fit_label": "Strong" | "Moderate" | "Weak",
      "reasoning": "1-2 sentence why",
      "evidence": ["short evidence phrase 1", "short evidence phrase 2"]
    }
  ],
  "discovery_gaps": [
    {
      "area": "Budget" | "Decision Process" | "Timeline" | "Technical" | "Stakeholders",
      "question": "Question to ask to close this gap",
      "why_important": "1 sentence why this matters"
    }
  ],
  "red_flags": [
    {
      "flag": "Short flag name",
      "severity": "high" | "medium" | "low",
      "detail": "1 sentence detail"
    }
  ],
  "not_a_fit": [
    {
      "product": "Product Name",
      "reason": "1 sentence why not"
    }
  ]
}

Rules:
- Include all 5 Tines products (Stories, Cases, Pages, AI Actions, API) in "products"
- 3-5 discovery_gaps ordered by importance
- Include red_flags only if present (can be empty array)
- Include not_a_fit only if present (can be empty array)
- Keep "reasoning" and "detail" fields SHORT (1-2 sentences max) to avoid truncation
- Evidence phrases should be 3-6 words each
- Return ONLY the JSON object. No markdown, no commentary.`,
        },
      ],
    });

    const raw = (msg.content[0] as any).text || '';
    let json = raw;
    const fenceMatch = json.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) json = fenceMatch[1];
    json = json.trim();
    if (!json.startsWith('{')) {
      const objStart = json.indexOf('{');
      if (objStart >= 0) json = json.slice(objStart);
    }

    let results;
    try {
      results = JSON.parse(json);
    } catch {
      // Repair truncated JSON: close open strings + open brackets
      let repaired = json;
      let inStr = false;
      let esc = false;
      for (let i = 0; i < repaired.length; i++) {
        const ch = repaired[i];
        if (esc) { esc = false; continue; }
        if (ch === '\\') { esc = true; continue; }
        if (ch === '"') inStr = !inStr;
      }
      if (inStr) repaired += '"';
      const stack: string[] = [];
      inStr = false;
      esc = false;
      for (let i = 0; i < repaired.length; i++) {
        const ch = repaired[i];
        if (esc) { esc = false; continue; }
        if (ch === '\\') { esc = true; continue; }
        if (ch === '"') { inStr = !inStr; continue; }
        if (inStr) continue;
        if (ch === '{' || ch === '[') stack.push(ch);
        else if (ch === '}' && stack[stack.length - 1] === '{') stack.pop();
        else if (ch === ']' && stack[stack.length - 1] === '[') stack.pop();
      }
      repaired = repaired.replace(/,\s*$/, '');
      while (stack.length) {
        const open = stack.pop();
        repaired += open === '{' ? '}' : ']';
      }
      try {
        results = JSON.parse(repaired);
      } catch {
        // Last resort: return a minimal valid shape so the UI renders
        results = {
          overall_score: 0,
          overall_label: 'Analysis Incomplete',
          overall_summary: 'The analysis was truncated. Please try again with shorter notes or paste the key excerpts only.',
          products: [],
          discovery_gaps: [],
          red_flags: [],
          not_a_fit: [],
          _truncated: true,
        };
      }
    }

    // Ensure required arrays exist so builder doesn't crash on `.length`
    results.products = results.products || [];
    results.discovery_gaps = results.discovery_gaps || [];
    results.red_flags = results.red_flags || [];
    results.not_a_fit = results.not_a_fit || [];
    results.overall_score = results.overall_score ?? 0;
    results.overall_label = results.overall_label || 'Unknown';
    results.overall_summary = results.overall_summary || '';

    return NextResponse.json({ results });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
