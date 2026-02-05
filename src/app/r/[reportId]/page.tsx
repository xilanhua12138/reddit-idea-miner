import type { Report } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"

import { supabaseAdmin } from "@/lib/supabase-admin"

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

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Reddit Idea Miner</h1>
        <p className="text-sm text-muted-foreground">
          Keyword: <span className="font-medium text-foreground">{report.query.keyword}</span>
          {report.query.subreddit ? (
            <>
              {" "}· Subreddit: <span className="font-medium text-foreground">r/{report.query.subreddit}</span>
            </>
          ) : null}
          {" "}· Range: <span className="font-medium text-foreground">{report.query.range}</span>
          {" "}· Posts: {report.stats.posts} · Comments: {report.stats.comments}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {report.ideas.map((idea) => (
          <Sheet key={idea.id}>
            <SheetTrigger asChild>
              <Card className="cursor-pointer hover:shadow-sm transition-shadow">
                <CardHeader>
                  <CardTitle className="text-base">{idea.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{idea.oneLiner}</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">pain {idea.scores.pain}</Badge>
                    <Badge variant="secondary">repeat {idea.scores.repeat}</Badge>
                    <Badge variant="secondary">pay {idea.scores.pay}</Badge>
                    <Badge>total {idea.scores.total}</Badge>
                    <Badge variant="outline">evidence {idea.quotes.length}</Badge>
                  </div>
                </CardContent>
              </Card>
            </SheetTrigger>

            <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
              <SheetHeader>
                <SheetTitle>{idea.title}</SheetTitle>
              </SheetHeader>

              <div className="mt-4 space-y-6">
                <section className="space-y-2">
                  <h3 className="text-sm font-semibold">Evidence</h3>
                  <div className="space-y-3">
                    {idea.quotes.map((q, i) => (
                      <div key={i} className="rounded-md border p-3">
                        <p className="text-sm">“{q.text}”</p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          来源: r/{q.subreddit} · {q.kind} · score {q.score} · u/{q.author}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>

                <Separator />

                <section className="space-y-2">
                  <h3 className="text-sm font-semibold">Insight</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{idea.insight}</p>
                </section>

                <section className="space-y-2">
                  <h3 className="text-sm font-semibold">Build</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{idea.build}</p>
                </section>

                <section className="space-y-2">
                  <h3 className="text-sm font-semibold">Actions</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{idea.actions}</p>
                </section>
              </div>
            </SheetContent>
          </Sheet>
        ))}
      </div>
    </main>
  )
}
