"use client"

import { useEffect, useMemo, useState } from "react"
import TinderCard from "react-tinder-card"
import type { Idea, Report } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { IdeaDrawer } from "@/components/idea-drawer"
import {
  dislikeIdea,
  hasSeenTutorial,
  likeIdea,
  markTutorialSeen,
} from "@/lib/library-store"

function TutorialOverlay(props: { open: boolean; onClose: () => void }) {
  if (!props.open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm">
      <div className="w-[92vw] max-w-sm rounded-xl border bg-background p-5 shadow-lg">
        <div className="space-y-2">
          <p className="text-sm font-medium">右滑喜欢 · 左滑不喜欢</p>
          <p className="text-sm text-muted-foreground">点卡片可看详情</p>
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

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [tutorialOpen, setTutorialOpen] = useState(false)

  useEffect(() => {
    setTutorialOpen(!hasSeenTutorial())
  }, [])

  const total = ideas.length

  const done = index >= total

  const stack = useMemo(() => {
    // render all cards so swipe library works; top card is last
    return ideas.slice(index)
  }, [ideas, index])

  function onSwipe(dir: string, idea: Idea) {
    if (dir === "right") likeIdea({ report, idea })
    if (dir === "left") dislikeIdea({ report, idea })

    setIndex((i) => i + 1)
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (tutorialOpen) return
      if (drawerOpen) return
      if (done) return

      if (e.key === "ArrowRight") {
        e.preventDefault()
        likeIdea({ report, idea: current })
        setIndex((i) => i + 1)
      } else if (e.key === "ArrowLeft") {
        e.preventDefault()
        dislikeIdea({ report, idea: current })
        setIndex((i) => i + 1)
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [current, done, drawerOpen, report, tutorialOpen])

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
        <div className="relative mx-auto h-[520px] w-full">
          {stack
            .map((idea) => (
              <TinderCard
                key={idea.id}
                onSwipe={(dir) => onSwipe(dir, idea)}
                preventSwipe={["up", "down"]}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <Card
                    className="w-full max-w-xl select-none"
                    onClick={() => setDrawerOpen(true)}
                  >
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
                      <p className="text-xs text-muted-foreground">
                        左滑不喜欢 · 右滑喜欢 · 点击看详情
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </TinderCard>
            ))
            .reverse()}
        </div>
      )}

      {current ? (
        <IdeaDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          idea={current}
        />
      ) : null}
    </main>
  )
}
