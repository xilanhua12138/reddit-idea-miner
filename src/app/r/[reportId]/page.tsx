import type { Report } from "@/lib/types"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { ReportDeck } from "@/components/report-deck"

async function getReport(reportId: string): Promise<Report> {
  const sb = supabaseAdmin()
  const { data, error } = await sb
    .from("reports")
    .select("report")
    .eq("id", reportId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) throw new Error("Report not found")

  return data.report as Report
}

export default async function ReportPage({ params }: { params: { reportId: string } }) {
  const report = await getReport(params.reportId)
  return <ReportDeck report={report} />
}
