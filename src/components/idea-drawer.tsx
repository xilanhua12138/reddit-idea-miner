"use client"

import type { Idea } from "@/lib/types"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"

export function IdeaDrawer(props: {
  open: boolean
  onOpenChange: (open: boolean) => void
  idea: Idea
}) {
  const { open, onOpenChange, idea } = props

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
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
  )
}
