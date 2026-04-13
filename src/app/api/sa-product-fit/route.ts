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

const FIT_CATEGORIES = [
  {
    id: 'security_automation',
    label: 'Security Automation Fit',
    description: 'How well does the prospect need workflow automation for security ops? Evaluate their need for automated alert triage, incident response playbooks, threat intelligence workflows, and cross-tool orchestration.',
  },
  {
    id: 'alert_fatigue',
    label: 'Alert Fatigue Impact',
    description: 'How severe is their alert volume problem? Look for SIEM alert overload, SOC analyst burnout, high false-positive rates, and manual enrichment bottlenecks.',
  },
  {
    id: 'soar_replacement',
    label: 'SOAR Replacement Value',
    description: 'Are they using a legacy SOAR that Tines can displace? Evaluate dissatisfaction with Splunk SOAR, Palo Alto XSOAR, Swimlane, or homegrown scripting. Look for complaints about complexity, per-action pricing, or vendor lock-in.',
  },
  {
    id: 'compliance_governance',
    label: 'Compliance & Governance',
    description: 'What regulatory requirements does Tines address? Evaluate SOC2, HIPAA, PCI-DSS, GDPR, FedRAMP, CMMC compliance automation needs. Look for audit trail requirements, policy enforcement gaps, and reporting bottlenecks.',
  },
  {
    id: 'soc_scalability',
    label: 'SOC Scalability',
    description: 'Would no-code automation help their team scale? Evaluate team size constraints, hiring challenges, analyst turnover, and the gap between alert volume and analyst capacity.',
  },
  {
    id: 'tool_consolidation',
    label: 'Tool Consolidation',
    description: 'Can Tines help reduce tool sprawl? Look for excessive security tool stacks, integration challenges, overlapping capabilities, and desire to consolidate vendors.',
  },
];

const PRODUCTS = [
  { id: 'stories', label: 'Tines Stories', description: 'Visual, no-code workflow builder. Automates security playbooks, alert triage, incident response, and cross-tool orchestration.' },
  { id: 'cases', label: 'Tines Cases', description: 'Built-in case management. Tracks incidents, investigations, and security workflows with full audit trails.' },
  { id: 'pages', label: 'Tines Pages', description: 'Custom forms and portals. Self-service intake, approval workflows, phishing report buttons, and stakeholder dashboards.' },
  { id: 'ai_actions', label: 'AI Actions', description: 'LLM-powered workflow steps. AI-driven alert summarization, triage decisions, and natural language automation.' },
  { id: 'api', label: 'Tines API', description: 'Full REST API. Programmatic workflow management, bulk operations, and CI/CD integration for security-as-code.' },
];

export async function POST(request: Request) {
  try {
    const { notes, account, techStack } = await request.json();
    if (!notes?.trim()) {
      return NextResponse.json({ error: 'Notes or account context are required' }, { status: 400 });
    }

    const systemPrompt = `You are a product-fit analyst for Tines, the leading no-code security automation platform. You evaluate how well Tines' products map to a prospect's security operations needs, tech stack, and pain points.

${TINES_CONTEXT}

== FIT CATEGORIES ==
${FIT_CATEGORIES.map(c => `${c.label}: ${c.description}`).join('\n\n')}

== TINES PRODUCTS ==
${PRODUCTS.map(p => `${p.label}: ${p.description}`).join('\n\n')}`;

    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4000,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Evaluate the product fit for this prospect across all categories and products.

Account: ${account || 'Unknown'}
Tech Stack: ${techStack || 'Not specified'}

Notes and context:
${notes}

Return ONLY a JSON object with this exact structure:
{
  "overall_score": 0-100,
  "overall_label": "Excellent Fit|Strong Fit|Moderate Fit|Weak Fit",
  "overall_color": "green|yellow|orange|red",
  "summary": "3-4 sentence executive summary of the product fit assessment",
  "categories": [
    {
      "id": "${FIT_CATEGORIES.map(c => c.id).join('|')}",
      "label": "Category Label",
      "score": 0-100,
      "color": "green|yellow|orange|red",
      "evidence": "What in the notes supports this score",
      "gaps": "What information is missing or concerning",
      "recommendation": "Specific action to improve fit or validate further"
    }
  ],
  "products": [
    {
      "id": "${PRODUCTS.map(p => p.id).join('|')}",
      "label": "Product Name",
      "relevance": "high|medium|low|none",
      "use_cases": ["Specific use case for this customer"],
      "value_statement": "One sentence on the value this product delivers for them",
      "demo_talking_point": "Key point to highlight in a demo"
    }
  ],
  "competitive_landscape": {
    "current_tools": ["Tools they currently use based on the notes"],
    "displacement_opportunity": "Which existing tools Tines could replace and why",
    "competitive_threats": ["Competitors likely in the deal and their positioning"]
  },
  "recommended_use_cases": [
    {
      "use_case": "Specific automation use case",
      "products_involved": ["Tines Stories", "Tines Cases"],
      "estimated_impact": "Quantified or qualified impact statement",
      "priority": "high|medium|low"
    }
  ],
  "discovery_questions": [
    "Question to ask to further validate fit"
  ]
}

Rules:
- Score each category: green=80-100 (strong evidence of need), yellow=60-79 (moderate signals), orange=40-59 (some potential), red=0-39 (weak fit).
- Overall score is weighted average favoring Security Automation Fit and Alert Fatigue Impact.
- Include all 6 categories and all 5 products.
- Include 3-5 recommended use cases ordered by priority.
- Include 4-6 discovery questions to validate remaining gaps.
- Be specific to what's in the notes — don't fabricate evidence.
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
