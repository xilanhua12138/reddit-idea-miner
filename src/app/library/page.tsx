"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { IdeaDrawer } from "@/components/idea-drawer"
import { loadLibrary, type LibraryEntry, type LibraryState } from "@/lib/library-store"
import { LIBRARY_EVENT } from "@/lib/library-events"

type Tab = "liked" | "disliked"

function EntryCard(props: {
  entry: LibraryEntry
  onOpen: () => void
}) {
  const { entry } = props
  const idea = entry.idea
  return (
    <Card className="cursor-pointer hover:shadow-sm transition-shadow" onClick={props.onOpen}>
      <CardHeader>
        <CardTitle className="text-base">{idea.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm text-muted-foreground">{idea.oneLiner}</p>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">pain {idea.scores.pain}</Badge>
          <Badge variant="secondary">repeat {idea.scores.repeat}</Badge>
          <Badge variant="secondary">pay {idea.scores.pay}</Badge>
          <Badge>total {idea.scores.total}</Badge>
          <Badge variant="outline">evidence {idea.quotes.length}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          来自：{entry.query.keyword}
          {entry.query.subreddit ? ` · r/${entry.query.subreddit}` : ""}
          {` · ${entry.query.range}`}
        </p>
      </CardContent>
    </Card>
  )
}

export default function LibraryPage() {
  const [tab, setTab] = useState<Tab>("liked")
  const [openIdea, setOpenIdea] = useState<LibraryEntry | null>(null)

  const [state, setState] = useState<LibraryState>(() => loadLibrary())

  useEffect(() => {
    function refresh() {
      setState(loadLibrary())
    }

    refresh()
    window.addEventListener("storage", refresh)
    window.addEventListener(LIBRARY_EVENT, refresh)
    return () => {
      window.removeEventListener("storage", refresh)
      window.removeEventListener(LIBRARY_EVENT, refresh)
    }
  }, [])

  const list = tab === "liked" ? state.liked : state.disliked

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">我的库</h1>
        <p className="text-sm text-muted-foreground">保存在你的浏览器本地。</p>
      </div>

      <div className="mb-4 flex gap-2">
        <button
          className={`rounded-md border px-3 py-2 text-sm ${tab === "liked" ? "bg-foreground text-background" : "bg-background"}`}
          onClick={() => setTab("liked")}
        >
          喜欢 ({state.liked.length})
        </button>
        <button
          className={`rounded-md border px-3 py-2 text-sm ${tab === "disliked" ? "bg-foreground text-background" : "bg-background"}`}
          onClick={() => setTab("disliked")}
        >
          不喜欢 ({state.disliked.length})
        </button>
      </div>

      <Separator className="mb-4" />

      {list.length === 0 ? (
        <p className="text-sm text-muted-foreground">这里还没有内容。</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {list.map((entry) => (
            <EntryCard key={`${entry.reportId}:${entry.idea.id}`} entry={entry} onOpen={() => setOpenIdea(entry)} />
          ))}
        </div>
      )}

      {openIdea ? (
        <IdeaDrawer
          open={!!openIdea}
          onOpenChange={(o) => {
            if (!o) setOpenIdea(null)
          }}
          idea={openIdea.idea}
        />
      ) : null}
    </main>
  )
}
