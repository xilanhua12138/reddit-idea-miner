/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server"
import { z } from "zod"
import { rateLimit } from "@/lib/memory-cache"
import { generateReport } from "@/lib/generate"
import { supabaseAdmin } from "@/lib/supabase-admin"

const BodySchema = z.object({
  keyword: z.string().min(1).max(120),
  subreddit: z.string().max(80).optional().or(z.literal("")),
  range: z.enum(["week", "month", "year"]),
})

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
  const rl = rateLimit(ip)
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { keyword, range } = parsed.data
  const subredditRaw = parsed.data.subreddit
  const subreddit = subredditRaw && subredditRaw.trim().length ? subredditRaw.trim() : undefined

  try {
    const report = await generateReport({ keyword, subreddit, range })

    const sb = supabaseAdmin()
    const { error } = await sb.from("reports").insert({
      id: report.id,
      keyword,
      subreddit: subreddit ?? null,
      range,
      report,
    })

    if (error) {
      return NextResponse.json({ error: `Supabase insert failed: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({ reportId: report.id })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 })
  }
}
