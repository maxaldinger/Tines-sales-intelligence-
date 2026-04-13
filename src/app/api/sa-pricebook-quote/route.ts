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
Pricing Model: Tines uses a flat-rate, usage-based licensing model — no per-action or per-run fees. Pricing scales with the number of Stories (workflows) and users, not execution volume. This is a major differentiator vs. competitors who charge per-action.
Common Objections: "We already have a SOAR" → Tines replaces legacy SOAR with true no-code and unlimited runs. "Our team can script it" → No-code means non-engineers can build and maintain, reducing key-person risk. "We're evaluating ServiceNow" → Tines is purpose-built for security, not a bolt-on to ITSM.
== END CONTEXT ==`;

export async function POST(request: Request) {
  try {
    const { notes, account, dealSize, products, termLength } = await request.json();
    if (!notes?.trim() && !products?.length) {
      return NextResponse.json({ error: 'Deal notes or product selection required' }, { status: 400 });
    }

    const systemPrompt = `You are a pricing and proposals expert for Tines, the leading no-code security automation platform. You help sales reps construct compelling pricing proposals that justify the investment by quantifying the ROI of security automation vs. manual SOC operations and legacy SOAR tools.

Key pricing principles:
- Tines uses flat-rate licensing — no per-action pricing (unlike competitors)
- Value is measured in analyst hours saved, MTTR reduction, and SOC throughput gains
- Always frame pricing against the cost of doing nothing (manual processes, analyst burnout, breach risk)
- Reference competitive pricing disadvantages (XSOAR per-action fees, Splunk SOAR complexity costs, ServiceNow overhead)

${TINES_CONTEXT}`;

    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4000,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Generate a pricing proposal framework for this opportunity.

Account: ${account || 'Unknown'}
Estimated Deal Size: ${dealSize || 'Not specified'}
Term Length: ${termLength || '12 months'}
Products of Interest: ${products ? products.join(', ') : 'All Tines products'}

Deal context and notes:
${notes || 'No specific notes provided'}

Return ONLY a JSON object with this exact structure:
{
  "quote_summary": {
    "account": "${account || 'Unknown'}",
    "date": "${new Date().toISOString().split('T')[0]}",
    "valid_until": "${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}",
    "term": "${termLength || '12 months'}",
    "total_estimated": "Estimated annual value range (e.g., '$75,000 - $150,000/yr')"
  },
  "line_items": [
    {
      "product": "Tines Stories|Tines Cases|Tines Pages|AI Actions|Tines API|Professional Services|Training",
      "description": "What this line item covers",
      "quantity": "Number of units, users, or stories",
      "unit": "per user/per story/per instance/flat",
      "estimated_range": "Price range estimate",
      "notes": "Justification or context for this line item"
    }
  ],
  "roi_analysis": {
    "current_cost_of_manual": "Estimated annual cost of manual security operations (analyst salaries, overtime, tool costs)",
    "projected_savings": "Estimated annual savings with Tines",
    "payback_period": "Estimated time to ROI",
    "key_metrics": [
      {
        "metric": "Metric name (e.g., 'Alert triage time reduction')",
        "before": "Current state",
        "after": "Projected state with Tines",
        "impact": "Business impact statement"
      }
    ]
  },
  "competitive_pricing": [
    {
      "competitor": "Competitor name",
      "pricing_model": "How they charge (per-action, per-user, etc.)",
      "estimated_cost": "What this customer would pay for similar capability",
      "tines_advantage": "Why Tines pricing is better for this customer"
    }
  ],
  "value_justification": [
    {
      "category": "Security Operations|Compliance|Risk Reduction|Team Efficiency|Tool Consolidation",
      "value_statement": "Specific value Tines delivers in this category",
      "quantification": "Dollar amount, percentage, or time savings estimate"
    }
  ],
  "discount_strategy": {
    "recommended_discount": "Percentage or dollar amount",
    "justification": "Why this discount level is appropriate",
    "conditions": ["What the customer should commit to in exchange (multi-year, case study, reference, etc.)"]
  },
  "negotiation_notes": [
    "Key negotiation point or strategy"
  ],
  "next_steps": [
    {
      "step": "Action item",
      "owner": "Tines|Customer|Joint",
      "timeline": "When this should happen"
    }
  ]
}

Rules:
- Include 3-6 line items covering relevant Tines products and services.
- Include 3-5 ROI key metrics with before/after comparisons.
- Include 2-3 competitive pricing comparisons.
- Include 3-5 value justification points.
- Include 3-5 negotiation notes.
- Include 3-5 next steps.
- All pricing should be directional ranges, not exact quotes (those come from the pricing team).
- Emphasize Tines' flat-rate model vs. per-action competitors.
- Frame everything against the cost of the status quo (manual SOC, legacy SOAR, breach risk).
- Be specific to the customer's situation based on the notes.
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
