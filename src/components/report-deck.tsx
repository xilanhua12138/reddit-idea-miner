"use client"

import { createRef, useEffect, useMemo, useState } from "react"
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
import { ReportHeader } from "@/components/report-header"
import { useT } from "@/components/locale-provider"

type SwipeDir = "left" | "right"

type TinderCardRef = {
  swipe: (dir?: SwipeDir) => Promise<void>
  restoreCard: () => Promise<void>
}

function TutorialOverlay(props: { open: boolean; onClose: () => void }) {
  const t = useT()
  if (!props.open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm">
      <div className="w-[92vw] max-w-sm rounded-xl border bg-background p-5 shadow-lg">
        <div className="space-y-2">
          <p className="text-sm font-medium">{t("tutorial.line1")}</p>
          <p className="text-sm text-muted-foreground">{t("tutorial.line2")}</p>
        </div>
        <button
          className="mt-4 w-full rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background"
          onClick={props.onClose}
        >
          {t("tutorial.gotit")}
        </button>
        <p className="mt-2 text-xs text-muted-foreground">{t("tutorial.keys")}</p>
      </div>
    </div>
  )
}

export function ReportDeck(props: { report: Report }) {
  const { report } = props
  const t = useT()

  const ideas = report.ideas
  const total = ideas.length

  const [index, setIndex] = useState(0)
  const [expanded, setExpanded] = useState(false)
  const [tutorialOpen, setTutorialOpen] = useState(false)

  useEffect(() => {
    setTutorialOpen(!hasSeenTutorial())
  }, [])

  const done = index >= total

  const defaultEvidenceCount = 3

  const childRefs = useMemo(() => {
    return Array.from({ length: ideas.length }, () => createRef<TinderCardRef>())
  }, [ideas.length])

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
        childRefs[index]?.current?.swipe("right")
      } else if (e.key === "ArrowLeft") {
        e.preventDefault()
        childRefs[index]?.current?.swipe("left")
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [childRefs, done, index, tutorialOpen])

  return (
    <main className="mx-auto min-h-[80vh] max-w-3xl px-4 py-8">
      <TutorialOverlay
        open={tutorialOpen}
        onClose={() => {
          markTutorialSeen()
          setTutorialOpen(false)
        }}
      />

      <ReportHeader report={report} index={index} total={total} />

      {done ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("report.done_title")}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {t("report.done_cta")} {" "}
            <a className="underline" href="/library">
              {t("library.title")}
            </a>
          </CardContent>
        </Card>
      ) : (
        <div className="relative mx-auto mt-6 h-[calc(100vh-260px)] min-h-[540px] max-h-[820px] w-full overflow-hidden">
          {[index + 1, index]
            .filter((i) => i >= 0 && i < ideas.length)
            .map((i) => {
              const idea = ideas[i]
              const isTop = i === index
              const layer = i - index // 0 (top), 1 (next)

              return (
                <TinderCard
                  ref={childRefs[i]}
                  key={idea.id}
                  onSwipe={(dir) => onSwipe(dir, idea)}
                  preventSwipe={
                    isTop ? ["up", "down"] : ["up", "down", "left", "right"]
                  }
                >
                  <div
                    className={`absolute inset-0 flex items-start justify-center pt-2 ${
                      isTop ? "pointer-events-auto" : "pointer-events-none"
                    }`}
                    style={
                      layer === 1
                        ? {
                            transform: "scale(0.97) translateY(10px)",
                            opacity: 0.85,
                          }
                        : undefined
                    }
                  >
                    <Card className="h-[clamp(560px,70vh,660px)] w-full max-w-xl select-none shadow-sm">
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
                            <TabsTrigger value="evidence">{t("tabs.evidence")}</TabsTrigger>
                            <TabsTrigger value="insight">{t("tabs.insight")}</TabsTrigger>
                            <TabsTrigger value="build">{t("tabs.build")}</TabsTrigger>
                            <TabsTrigger value="actions">{t("tabs.actions")}</TabsTrigger>
                          </TabsList>

                          <TabsContent
                            value="evidence"
                            className="max-h-[320px] space-y-2 overflow-y-auto pr-1"
                          >
                            {(expanded
                              ? idea.quotes
                              : idea.quotes.slice(0, defaultEvidenceCount)
                            ).map((q, qi) => (
                              <div key={qi} className="rounded-md border p-3">
                                <p className="text-sm">&quot;{q.text}&quot;</p>
                                <p className="mt-2 text-xs text-muted-foreground">
                                  {t("evidence.source")}: r/{q.subreddit} · {q.kind} · score {q.score} · u/{q.author}
                                </p>
                              </div>
                            ))}
                          </TabsContent>

                          <TabsContent value="insight">
                            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                              {idea.insight}
                            </p>
                          </TabsContent>

                          <TabsContent value="build">
                            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                              {idea.build}
                            </p>
                          </TabsContent>

                          <TabsContent value="actions">
                            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                              {idea.actions}
                            </p>
                          </TabsContent>
                        </Tabs>

                        {idea.quotes.length > defaultEvidenceCount ? (
                          <button
                            type="button"
                            className="text-xs text-muted-foreground underline"
                            onClick={() => setExpanded((v) => !v)}
                          >
                            {expanded ? t("evidence.less") : t("evidence.more")}
                          </button>
                        ) : null}

                        <p className="text-xs text-muted-foreground">{t("report.hint")}</p>
                      </CardContent>
                    </Card>
                  </div>
                </TinderCard>
              )
            })}
        </div>
      )}
    </main>
  )
}
