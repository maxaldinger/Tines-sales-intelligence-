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
    const { notes, account, requirements, timeline } = await request.json();
    if (!notes?.trim() && !requirements?.trim()) {
      return NextResponse.json({ error: 'Deal notes or requirements are required' }, { status: 400 });
    }

    const systemPrompt = `You are a proposal writing expert for Tines, the leading no-code security automation platform. You create compelling, professional proposals that articulate business value, address security operations pain points, and position Tines as the clear choice over legacy SOAR tools.

Your proposals should be executive-ready, emphasizing ROI, time-to-value, and strategic alignment with the customer's security operations goals.

${TINES_CONTEXT}`;

    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4000,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Generate a professional proposal for this opportunity.

Account: ${account || 'Unknown'}
Timeline: ${timeline || 'Not specified'}

Deal notes and requirements:
${notes || ''}
${requirements ? `\nSpecific requirements:\n${requirements}` : ''}

Return ONLY a JSON object with this exact structure:
{
  "title": "Proposal title (e.g., 'Security Automation Proposal for [Company]')",
  "date": "${new Date().toISOString().split('T')[0]}",
  "executive_summary": "3-4 paragraph executive summary. Open with their pain, bridge to the solution, close with expected outcomes. Reference specific Tines products (Stories, Cases, Pages, AI Actions). Include quantifiable value statements (e.g., 90% reduction in alert triage time, 10x SOC throughput).",
  "business_challenges": [
    {
      "challenge": "Specific business/security challenge",
      "impact": "Business impact of this challenge (cost, risk, efficiency)",
      "tines_solution": "How Tines specifically addresses this challenge"
    }
  ],
  "recommended_solution": {
    "overview": "2-3 sentence solution overview",
    "components": [
      {
        "product": "Tines Stories|Tines Cases|Tines Pages|AI Actions|Tines API",
        "use_case": "Specific use case for this product",
        "value": "Expected outcome or value delivered"
      }
    ],
    "integration_points": ["List of tools/systems Tines would integrate with based on the notes"],
    "implementation_phases": [
      {
        "phase": "Phase name",
        "duration": "Timeline",
        "deliverables": ["What gets delivered"],
        "success_criteria": ["How success is measured"]
      }
    ]
  },
  "why_us": [
    {
      "differentiator": "Key differentiator",
      "detail": "Why this matters for this specific customer",
      "proof_point": "Customer reference or data point"
    }
  ],
  "next_steps": [
    {
      "step": "Action item",
      "owner": "Tines|Customer|Joint",
      "timeline": "When this should happen"
    }
  ],
  "closing_statement": "2-3 sentence closing that reinforces urgency and value. Reference their specific pain points and Tines' unique ability to solve them."
}

Rules:
- Include 3-5 business challenges.
- Include 3-5 solution components referencing specific Tines products.
- Include 2-3 implementation phases.
- Include 3-4 differentiators in why_us with proof points.
- Include 4-6 next steps.
- Be specific to the customer's situation — don't be generic.
- Emphasize no-code, unlimited runs (no per-action pricing), and vendor-agnostic integrations.
- Reference competitors where relevant (Splunk SOAR, XSOAR) as legacy approaches Tines replaces.
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
