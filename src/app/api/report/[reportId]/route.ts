import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function GET(_req: Request, ctx: { params: { reportId: string } }) {
  const reportId = ctx.params.reportId
  if (!reportId) return NextResponse.json({ error: "Missing reportId" }, { status: 400 })

  const sb = supabaseAdmin()
  const { data, error } = await sb
    .from("reports").select("report").eq("id", reportId).maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json(data.report)
}
