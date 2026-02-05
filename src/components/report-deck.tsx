"use client"

/* eslint-disable @typescript-eslint/no-explicit-any */
import { createRef, useEffect, useMemo, useState } from "react"
import TinderCard from "react-tinder-card"
import { useTranslations } from "next-intl"
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

function TutorialOverlay(props: { open: boolean; onClose: () => void }) {
  const t = useTranslations()
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
        <p className="mt-2 text-xs text-muted-foreground">
          {t("tutorial.keys")}
        </p>
      </div>
    </div>
  )
}

export function ReportDeck(props: { report: Report }) {
  const { report } = props
  const t = useTranslations()

  const ideas = report.ideas

  const [index, setIndex] = useState(0)

  const [expanded, setExpanded] = useState(false)
  const [tutorialOpen, setTutorialOpen] = useState(false)

  useEffect(() => {
    setTutorialOpen(!hasSeenTutorial())
  }, [])

  const total = ideas.length

  const done = index >= total

  // Inline details: show full content inside the card. Evidence defaults to 3 quotes.
  const defaultEvidenceCount = 3

  const childRefs = useMemo(
    () => Array.from({ length: ideas.length }, () => createRef<any>()),
    [ideas.length]
  )

  const stack = useMemo(() => {
    // render remaining cards; top card is last
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
            {t("report.done_cta")} <a className="underline" href="/library">{t("library.title")}</a>
          </CardContent>
        </Card>
      ) : (
        <div className="relative mx-auto mt-6 w-full overflow-hidden h-[calc(100vh-260px)] min-h-[520px] max-h-[760px]">
          {stack
            .map((idea) => (
              <TinderCard
                ref={childRefs[index + stack.indexOf(idea)]}
                key={idea.id}
                onSwipe={(dir) => onSwipe(dir, idea)}
                preventSwipe={["up", "down"]}
              >
                <div className="absolute inset-0 flex items-start justify-center pt-2">
                  <Card className="w-full max-w-xl select-none shadow-sm h-[600px]">
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

                        <TabsContent value="evidence" className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
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

                      <p className="text-xs text-muted-foreground">{t("report.hint")}</p>
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
