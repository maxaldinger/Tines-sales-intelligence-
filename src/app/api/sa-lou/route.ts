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
Key Differentiators: Only security automation platform with true no-code (not low-code), no per-action pricing (unlimited runs), vendor-agnostic integrations (works with any API), SOC2 Type II certified, used by top security teams at Snowflake, Canva, Databricks, Mars, McKesson.
Target Industries: Financial Services, Healthcare, Technology, Government/Defense, Critical Infrastructure
ICP: Enterprises (1000+ employees) with mature security teams, SIEM/EDR/ITSM tool stacks, and manual triage or response processes
Competitors: Splunk SOAR (complex, requires scripting), Palo Alto XSOAR (expensive, vendor lock-in), Torq (newer, less proven), Swimlane (complex low-code), ServiceNow SecOps (heavy IT overhead)
Common Objections: "We already have a SOAR" → Tines replaces legacy SOAR with true no-code and unlimited runs. "Our team can script it" → No-code means non-engineers can build and maintain, reducing key-person risk. "We're evaluating ServiceNow" → Tines is purpose-built for security, not a bolt-on to ITSM.
== END CONTEXT ==`;

export async function POST(request: Request) {
  try {
    const { notes, account, attendees } = await request.json();
    if (!notes?.trim()) {
      return NextResponse.json({ error: 'Call notes are required' }, { status: 400 });
    }

    const systemPrompt = `You are an expert LOU (Letter of Understanding) writer for Tines, the leading no-code security automation platform. You help sales reps create professional, structured letters of understanding from discovery calls and meetings.

Your job is to extract key issues, customer requirements, and commitments from raw call notes, then organize them into a structured LOU that can be sent to the prospect.

${TINES_CONTEXT}

Categories for LOU rows:
- Security Automation: Workflow automation needs for security operations (alert triage, incident response, threat intelligence)
- Alert Triage: Alert fatigue, SIEM noise reduction, automated enrichment and prioritization
- Incident Response: Manual IR processes, playbook automation, cross-tool orchestration
- Compliance & Governance: Regulatory requirements (SOC2, HIPAA, PCI-DSS, GDPR), audit automation, policy enforcement
- Tool Consolidation: Reducing tool sprawl, vendor consolidation, replacing legacy SOAR platforms`;

    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 3000,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Extract a structured Letter of Understanding from these call notes.

Account: ${account || 'Unknown'}
Attendees: ${attendees || 'Not specified'}

Call Notes:
${notes}

Return ONLY a JSON object with this exact structure:
{
  "rows": [
    {
      "issue": "The customer's stated problem or requirement",
      "response": "How Tines addresses this (reference specific products: Stories, Cases, Pages, AI Actions where relevant)",
      "category": "Security Automation|Alert Triage|Incident Response|Compliance & Governance|Tool Consolidation",
      "priority": "high|medium|low",
      "timeframe": "immediate|short-term|long-term"
    }
  ]
}

Rules:
- Extract 5-10 rows from the notes.
- Each row should map a customer pain point to a specific Tines capability.
- Priority: "high" = explicitly called out as urgent or blocking. "medium" = discussed with interest. "low" = mentioned in passing.
- Timeframe: "immediate" = needed within 30 days. "short-term" = 1-3 months. "long-term" = 3+ months.
- Be specific to what was actually discussed — don't invent issues not in the notes.
- Reference Tines products by name (Stories, Cases, Pages, AI Actions) in responses.
- Return ONLY the JSON object.`,
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

    const result = JSON.parse(json);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
