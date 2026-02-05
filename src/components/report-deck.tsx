"use client"

import { useEffect, useMemo, useState } from "react"
import TinderCard from "react-tinder-card"
import type { Idea, Report } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  dislikeIdea,
  hasSeenTutorial,
  likeIdea,
  markTutorialSeen,
} from "@/lib/library-store"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

function TutorialOverlay(props: { open: boolean; onClose: () => void }) {
  if (!props.open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm">
      <div className="w-[92vw] max-w-sm rounded-xl border bg-background p-5 shadow-lg">
        <div className="space-y-2">
          <p className="text-sm font-medium">右滑喜欢 · 左滑不喜欢</p>
          <p className="text-sm text-muted-foreground">卡片里直接看详情</p>
        </div>
        <button
          className="mt-4 w-full rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background"
          onClick={props.onClose}
        >
          知道了
        </button>
        <p className="mt-2 text-xs text-muted-foreground">
          快捷键：← 不喜欢，→ 喜欢
        </p>
      </div>
    </div>
  )
}

export function ReportDeck(props: { report: Report }) {
  const { report } = props

  const ideas = report.ideas

  const [index, setIndex] = useState(0)
  const current = ideas[index]

  const [expanded, setExpanded] = useState(false)
  const [tutorialOpen, setTutorialOpen] = useState(false)

  useEffect(() => {
    setTutorialOpen(!hasSeenTutorial())
  }, [])

  const total = ideas.length

  const done = index >= total

  // Inline details: show full content inside the card. Evidence defaults to 3 quotes.
  const defaultEvidenceCount = 3

  const stack = useMemo(() => {
    // render all cards so swipe library works; top card is last
    return ideas.slice(index)
  }, [ideas, index])

  function onSwipe(dir: string, idea: Idea) {
    if (dir === "right") likeIdea({ report, idea })
    if (dir === "left") dislikeIdea({ report, idea })

    setExpanded(false)
    setIndex((i) => i + 1)
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (tutorialOpen) return
      if (done) return

      if (e.key === "ArrowRight") {
        e.preventDefault()
        likeIdea({ report, idea: current })
        setExpanded(false)
        setIndex((i) => i + 1)
      } else if (e.key === "ArrowLeft") {
        e.preventDefault()
        dislikeIdea({ report, idea: current })
        setExpanded(false)
        setIndex((i) => i + 1)
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [current, done, report, tutorialOpen])

  return (
    <main className="mx-auto min-h-[80vh] max-w-3xl px-4 py-8">
      <TutorialOverlay
        open={tutorialOpen}
        onClose={() => {
          markTutorialSeen()
          setTutorialOpen(false)
        }}
      />

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
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {Math.min(index + 1, total)}/{total}
        </p>
      </div>

      {done ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">All done</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            已经全部滑完。去 <a className="underline" href="/library">Library</a> 查看喜欢/不喜欢。
          </CardContent>
        </Card>
      ) : (
        <div className="relative mx-auto mt-6 w-full overflow-hidden h-[calc(100vh-260px)] min-h-[520px] max-h-[760px]">
          {stack
            .map((idea) => (
              <TinderCard
                key={idea.id}
                onSwipe={(dir) => onSwipe(dir, idea)}
                preventSwipe={["up", "down"]}
              >
                <div className="absolute inset-0 flex items-start justify-center pt-2">
                  <Card className="w-full max-w-xl select-none shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-base">{idea.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">{idea.oneLiner}</p>

                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">pain {idea.scores.pain}</Badge>
                        <Badge variant="secondary">repeat {idea.scores.repeat}</Badge>
                        <Badge variant="secondary">pay {idea.scores.pay}</Badge>
                        <Badge>total {idea.scores.total}</Badge>
                        <Badge variant="outline">evidence {idea.quotes.length}</Badge>
                      </div>

                      <Tabs defaultValue="evidence" className="w-full">
                        <TabsList>
                          <TabsTrigger value="evidence">Evidence</TabsTrigger>
                          <TabsTrigger value="insight">Insight</TabsTrigger>
                          <TabsTrigger value="build">Build</TabsTrigger>
                          <TabsTrigger value="actions">Actions</TabsTrigger>
                        </TabsList>

                        <TabsContent value="evidence" className="space-y-2">
                          {(expanded ? idea.quotes : idea.quotes.slice(0, defaultEvidenceCount)).map((q, i) => (
                            <div key={i} className="rounded-md border p-3">
                              <p className="text-sm">“{q.text}”</p>
                              <p className="mt-2 text-xs text-muted-foreground">
                                来源: r/{q.subreddit} · {q.kind} · score {q.score} · u/{q.author}
                              </p>
                            </div>
                          ))}
                        </TabsContent>

                        <TabsContent value="insight">
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{idea.insight}</p>
                        </TabsContent>

                        <TabsContent value="build">
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{idea.build}</p>
                        </TabsContent>

                        <TabsContent value="actions">
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{idea.actions}</p>
                        </TabsContent>
                      </Tabs>

                      {idea.quotes.length > defaultEvidenceCount ? (
                        <button
                          type="button"
                          className="text-xs text-muted-foreground underline"
                          onClick={() => setExpanded((v) => !v)}
                        >
                          {expanded ? "收起" : "展开更多"}
                        </button>
                      ) : null}

                      <p className="text-xs text-muted-foreground">
                        左滑不喜欢 · 右滑喜欢 · （←/→）快捷键
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </TinderCard>
            ))
            .reverse()}
        </div>
      )}

    </main>
  )
}
