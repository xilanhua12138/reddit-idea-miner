"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LangSwitch } from "@/components/lang-switch"

type Range = "week" | "month" | "year"

type Labels = {
  appName: string
  subtitle: string
  libraryTitle: string
  keyword: string
  keywordPh: string
  subreddit: string
  subredditPh: string
  range: string
  rangeWeek: string
  rangeMonth: string
  rangeYear: string
  generate: string
  generating: string
  keywordRequired: string
  genericFail: string
}

export function HomeClient(props: { labels: Labels }) {
  const { labels } = props
  const router = useRouter()

  const [keyword, setKeyword] = useState("")
  const [subreddit, setSubreddit] = useState("")
  const [range, setRange] = useState<Range>("month")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onGenerate() {
    setError(null)
    if (!keyword.trim()) {
      setError(labels.keywordRequired)
      return
    }

    setLoading(true)
    try {
      // Client-side Reddit fetch (avoids some serverless IP 403 blocks)
      const { redditTryBases, buildSearchUrl, buildCommentsUrl } = await import(
        "@/lib/client-reddit"
      )
      const { generateReportClient } = await import("@/lib/generate-client")

      const report = await generateReportClient({
        keyword,
        subreddit: subreddit.trim() || undefined,
        range,
        fetchSearch: () =>
          redditTryBases((base) =>
            buildSearchUrl(base, {
              keyword,
              subreddit: subreddit.trim() || undefined,
              range,
              limit: 50,
            })
          ),
        fetchComments: (postId) => redditTryBases((base) => buildCommentsUrl(base, postId)),
      })

      const res = await fetch("/api/report/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || `Save failed (${res.status})`)

      router.push(`/r/${data.reportId}`)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : null
      setError(msg || labels.genericFail)
    } finally {
      setLoading(false)
    }
  }

  const rangeLabel: Record<Range, string> = {
    week: labels.rangeWeek,
    month: labels.rangeMonth,
    year: labels.rangeYear,
  }

  return (
    <main className="mx-auto flex min-h-[80vh] max-w-3xl items-center px-4 py-10">
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-xl">{labels.appName}</CardTitle>
              <p className="text-sm text-muted-foreground">{labels.subtitle}</p>
              <a className="mt-2 inline-block text-sm underline" href="/library">
                {labels.libraryTitle}
              </a>
            </div>
            <LangSwitch />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{labels.keyword}</label>
            <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder={labels.keywordPh} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{labels.subreddit}</label>
            <Input
              value={subreddit}
              onChange={(e) => setSubreddit(e.target.value)}
              placeholder={labels.subredditPh}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{labels.range}</label>
            <div className="flex gap-2">
              {(["week", "month", "year"] as Range[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRange(r)}
                  className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                    range === r ? "bg-foreground text-background" : "bg-background"
                  }`}
                >
                  {rangeLabel[r]}
                </button>
              ))}
            </div>
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <Button onClick={onGenerate} disabled={loading} className="w-full">
            {loading ? labels.generating : labels.generate}
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
