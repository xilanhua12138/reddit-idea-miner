/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type Range = "week" | "month" | "year"

export default function HomePage() {
  const router = useRouter()
  const [keyword, setKeyword] = useState("")
  const [subreddit, setSubreddit] = useState("")
  const [range, setRange] = useState<Range>("month")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onGenerate() {
    setError(null)
    if (!keyword.trim()) {
      setError("Keyword is required")
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
        fetchComments: (postId) =>
          redditTryBases((base) => buildCommentsUrl(base, postId)),
      })

      // Save to Supabase via server (service role key stays server-only)
      const res = await fetch("/api/report/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || `Save failed (${res.status})`)

      router.push(`/r/${data.reportId}`)
    } catch (e: any) {
      setError(
        e?.message ||
          "Failed. If you see Reddit 403, try again or switch time range/subreddit."
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-[80vh] max-w-3xl items-center px-4 py-10">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl">Reddit Idea Miner</CardTitle>
          <p className="text-sm text-muted-foreground">
            Generate 10 evidence-backed product ideas from real Reddit JSON.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Keyword *</label>
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="e.g. table of contents"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Subreddit (optional)</label>
            <Input
              value={subreddit}
              onChange={(e) => setSubreddit(e.target.value)}
              placeholder="e.g. productivity"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Time range</label>
            <div className="flex gap-2">
              {(["week", "month", "year"] as Range[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRange(r)}
                  className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                    range === r
                      ? "bg-foreground text-background"
                      : "bg-background"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <Button onClick={onGenerate} disabled={loading} className="w-full">
            {loading ? "Generating…" : "Generate report"}
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
