import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import type { Report, Quote } from "@/lib/types"

const MOONSHOT_API_KEY = process.env.MOONSHOT_API_KEY
const MOONSHOT_BASE_URL = "https://api.moonshot.cn/v1"

async function callMoonshot(messages: Array<{role: string; content: string}>, temperature = 0.7) {
  const res = await fetch(`${MOONSHOT_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${MOONSHOT_API_KEY}`,
    },
    body: JSON.stringify({
      model: "kimi-k2.5",
      messages,
      temperature,
      max_tokens: 4000,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Moonshot API error: ${res.status} ${err}`)
  }

  const data = await res.json()
  return data.choices[0]?.message?.content || ""
}

function buildAnalysisPrompt(keyword: string, subreddit: string | undefined, quotes: Quote[]) {
  const quotesText = quotes
    .map((q, i) => `[${i + 1}] ${q.kind.toUpperCase()} from r/${q.subreddit} (score: ${q.score}): "${q.text.slice(0, 400)}"`)
    .join("\n\n")

  return `You are a product analyst specialized in identifying startup ideas from user pain points.

TASK: Analyze the following Reddit posts/comments about "${keyword}"${subreddit ? ` in r/${subreddit}` : ""} and identify 10 high-potential product/business ideas.

RAW DATA (Reddit quotes):
${quotesText}

INSTRUCTIONS:
1. Group related pain points into 10 distinct idea clusters
2. For each idea, provide:
   - title: A catchy, specific product name (not generic like "Idea 1")
   - oneLiner: One sentence describing the core value proposition
   - pain: Rate 1-5 (how painful is this problem?)
   - repeat: Rate 1-5 (how often do users encounter this?)
   - pay: Rate 1-5 (willingness to pay based on mentions of money/pricing)
   - insight: 2-3 sentences analyzing the underlying pain and opportunity
   - build: Concrete MVP features (3-5 bullet points)
   - actions: Go-to-market steps (3-4 specific actions)
   - quoteIndices: Select 3-5 most relevant quote indices from the raw data above

OUTPUT FORMAT (JSON only):
{
  "ideas": [
    {
      "title": "...",
      "oneLiner": "...",
      "pain": 4,
      "repeat": 5,
      "pay": 3,
      "insight": "...",
      "build": "...",
      "actions": "...",
      "quoteIndices": [1, 3, 7]
    }
  ]
}

Rules:
- Be specific and actionable, not vague
- Titles should sound like real products
- Insights must reference actual patterns in the quotes
- Build suggestions should be implementable by a small team
- Return ONLY the JSON, no markdown code blocks`
}

export async function POST(req: NextRequest) {
  if (!MOONSHOT_API_KEY) {
    return NextResponse.json({ error: "MOONSHOT_API_KEY not configured" }, { status: 500 })
  }

  try {
    const body = await req.json()
    const { keyword, subreddit, range, quotes, stats } = body

    if (!keyword || !quotes || !Array.isArray(quotes)) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    // Limit quotes to avoid token overflow (max ~50 quotes)
    const limitedQuotes = quotes.slice(0, 50)

    // Call Moonshot for AI analysis
    const prompt = buildAnalysisPrompt(keyword, subreddit, limitedQuotes)
    const aiResponse = await callMoonshot([
      { role: "system", content: "You are a startup idea analyst. Always respond with valid JSON only." },
      { role: "user", content: prompt },
    ])

    // Parse AI response
    let parsed: { ideas: Array<{
      title?: string
      oneLiner?: string
      pain?: number
      repeat?: number
      pay?: number
      insight?: string
      build?: string
      actions?: string
      quoteIndices?: number[]
    }> }
    try {
      const cleanJson = aiResponse.replace(/```json\n?|\n?```/g, "").trim()
      parsed = JSON.parse(cleanJson)
    } catch {
      console.error("Failed to parse AI response:", aiResponse)
      return NextResponse.json({ error: "AI response parsing failed", raw: aiResponse }, { status: 500 })
    }

    // Transform to our Report format
    const crypto = await import("crypto")
    const reportId = crypto.createHash("sha256").update(`${keyword}|${subreddit || ""}|${range}|${Date.now()}`).digest("hex").slice(0, 12)

    const ideas = parsed.ideas.slice(0, 10).map((idea, idx) => {
      const selectedQuotes = (idea.quoteIndices || [idx % limitedQuotes.length])
        .slice(0, 5)
        .map((i: number) => limitedQuotes[Math.min(i - 1, limitedQuotes.length - 1)])
        .filter((q): q is Quote => Boolean(q))

      return {
        id: crypto.createHash("sha256").update(`${reportId}:${idx}`).digest("hex").slice(0, 12),
        title: idea.title || `Idea ${idx + 1}`,
        oneLiner: idea.oneLiner || "A solution to this recurring pain point.",
        scores: {
          pain: Math.min(5, Math.max(1, Math.round(idea.pain || 3))),
          repeat: Math.min(5, Math.max(1, Math.round(idea.repeat || 3))),
          pay: Math.min(5, Math.max(1, Math.round(idea.pay || 3))),
          total: Math.min(15, Math.round((idea.pain || 3) + (idea.repeat || 3) + (idea.pay || 3))),
        },
        quotes: selectedQuotes.length > 0 ? selectedQuotes : limitedQuotes.slice(idx * 3, idx * 3 + 3),
        insight: idea.insight || "Users express frustration with current solutions.",
        build: idea.build || "MVP: Simple web app solving the core workflow.",
        actions: idea.actions || "Launch on relevant subreddits and Product Hunt.",
      }
    })

    const report: Report = {
      id: reportId,
      createdAt: new Date().toISOString(),
      query: { keyword, subreddit, range },
      stats: stats || { posts: 0, comments: 0 },
      ideas,
    }

    // Save to Supabase
    const { error: dbError } = await supabaseAdmin()
      .from("reports")
      .insert({
        id: report.id,
        keyword,
        subreddit: subreddit || null,
        range,
        report: report as unknown as Record<string, unknown>,
      })

    if (dbError) {
      console.error("Supabase insert error:", dbError)
      return NextResponse.json({ error: "Failed to save report" }, { status: 500 })
    }

    return NextResponse.json({ report })
  } catch (err: unknown) {
    console.error("Analyze API error:", err)
    const msg = err instanceof Error ? err.message : "Internal error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
