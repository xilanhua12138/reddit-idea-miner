"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { IdeaDrawer } from "@/components/idea-drawer"
import { loadLibrary, type LibraryEntry } from "@/lib/library-store"

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

  const state = useMemo(() => loadLibrary(), [])
  const list = tab === "liked" ? state.liked : state.disliked

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Library</h1>
        <p className="text-sm text-muted-foreground">Stored locally in your browser.</p>
      </div>

      <div className="mb-4 flex gap-2">
        <button
          className={`rounded-md border px-3 py-2 text-sm ${tab === "liked" ? "bg-foreground text-background" : "bg-background"}`}
          onClick={() => setTab("liked")}
        >
          Liked ({state.liked.length})
        </button>
        <button
          className={`rounded-md border px-3 py-2 text-sm ${tab === "disliked" ? "bg-foreground text-background" : "bg-background"}`}
          onClick={() => setTab("disliked")}
        >
          Disliked ({state.disliked.length})
        </button>
      </div>

      <Separator className="mb-4" />

      {list.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing here yet.</p>
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
