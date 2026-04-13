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
    const { notes, account, contacts } = await request.json();
    if (!notes?.trim() && !contacts?.length) {
      return NextResponse.json({ error: 'Notes or existing contacts are required' }, { status: 400 });
    }

    const systemPrompt = `You are a multi-threading strategy expert for enterprise security automation deals at Tines. You help sales reps identify, prioritize, and engage multiple stakeholders within target accounts — including CISOs, SOC Managers, VP Security, IT Directors, and Security Engineers.

Your goal is to evaluate the current deal threading and recommend how to expand engagement across the buying committee.

${TINES_CONTEXT}`;

    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 3000,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Analyze the multi-threading status of this deal and provide recommendations.

Account: ${account || 'Unknown'}

Current contacts/relationships:
${contacts ? JSON.stringify(contacts, null, 2) : 'None provided'}

Deal notes and context:
${notes || 'No notes provided'}

Return ONLY a JSON object with this exact structure:
{
  "score": 0-100,
  "score_label": "Well-Threaded|Moderately Threaded|Under-Threaded|Single-Threaded",
  "score_color": "green|yellow|orange|red",
  "summary": "2-3 sentence assessment of the deal's threading health and biggest risk",
  "contacts": [
    {
      "title": "Job Title",
      "department": "Department",
      "role_in_deal": "Economic Buyer|Champion|Technical Evaluator|Influencer|End User|Blocker",
      "status": "engaged|identified|unknown",
      "priority": "critical|high|medium|low",
      "talking_points": ["Point relevant to their role and Tines value"],
      "outreach_suggestion": "Specific approach for engaging this person",
      "linkedin_search": "LinkedIn search query to find this person"
    }
  ],
  "gaps": [
    {
      "role": "Missing role in the buying committee",
      "risk": "What could go wrong without this person engaged",
      "action": "How to identify and engage them"
    }
  ],
  "recommendations": [
    "Specific actionable recommendation for improving deal threading"
  ]
}

Rules:
- Score: green=80-100 (4+ engaged contacts across buying committee), yellow=60-79 (2-3 contacts), orange=40-59 (1-2 contacts), red=0-39 (single-threaded).
- Include 4-8 contacts (mix of existing and recommended new ones).
- Include 2-4 gaps identifying missing stakeholders.
- Include 3-5 recommendations.
- For security automation deals, the typical buying committee includes: CISO/VP Security (economic buyer), SOC Manager (champion/evaluator), Security Engineers (technical evaluators), IT Director (infrastructure approval), Compliance/Risk (governance sign-off).
- Talking points should reference specific Tines capabilities (Stories, Cases, Pages, AI Actions).
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
