/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server"
import { z } from "zod"
import { supabaseAdmin } from "@/lib/supabase-admin"

const BodySchema = z.object({
  report: z.any(),
})

export async function POST(req: Request) {
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

  const report = parsed.data.report as any
  if (!report?.id || !report?.query?.keyword || !report?.query?.range) {
    return NextResponse.json({ error: "Invalid report shape" }, { status: 400 })
  }

  const sb = supabaseAdmin()
  const { error } = await sb.from("reports").insert({
    id: report.id,
    keyword: String(report.query.keyword),
    subreddit: report.query.subreddit ? String(report.query.subreddit) : null,
    range: String(report.query.range),
    report,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ reportId: report.id })
}
