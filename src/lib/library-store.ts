/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Idea, Report } from "@/lib/types"

export type LibraryEntry = {
  reportId: string
  savedAt: string
  idea: Idea
  query: Report["query"]
}

export type LibraryState = {
  liked: LibraryEntry[]
  disliked: LibraryEntry[]
}

const KEY = "rim:library:v1"

function safeParse(json: string | null): LibraryState | null {
  if (!json) return null
  try {
    const obj = JSON.parse(json)
    if (!obj || typeof obj !== "object") return null
    return {
      liked: Array.isArray(obj.liked) ? obj.liked : [],
      disliked: Array.isArray(obj.disliked) ? obj.disliked : [],
    }
  } catch {
    return null
  }
}

export function loadLibrary(): LibraryState {
  if (typeof window === "undefined") return { liked: [], disliked: [] }
  return safeParse(window.localStorage.getItem(KEY)) || { liked: [], disliked: [] }
}

export function saveLibrary(state: LibraryState) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(KEY, JSON.stringify(state))
}

export function upsertEntry(list: LibraryEntry[], entry: LibraryEntry): LibraryEntry[] {
  // uniqueness: (reportId + idea.id)
  const idx = list.findIndex((x) => x.reportId === entry.reportId && x.idea.id === entry.idea.id)
  if (idx >= 0) {
    const copy = list.slice()
    copy[idx] = entry
    return copy
  }
  return [entry, ...list]
}

export function removeEntry(list: LibraryEntry[], reportId: string, ideaId: string): LibraryEntry[] {
  return list.filter((x) => !(x.reportId === reportId && x.idea.id === ideaId))
}

export function likeIdea(params: { report: Report; idea: Idea }) {
  const { report, idea } = params
  const state = loadLibrary()
  const entry: LibraryEntry = {
    reportId: report.id,
    savedAt: new Date().toISOString(),
    idea,
    query: report.query,
  }
  const liked = upsertEntry(state.liked, entry)
  const disliked = removeEntry(state.disliked, report.id, idea.id)
  saveLibrary({ liked, disliked })
}

export function dislikeIdea(params: { report: Report; idea: Idea }) {
  const { report, idea } = params
  const state = loadLibrary()
  const entry: LibraryEntry = {
    reportId: report.id,
    savedAt: new Date().toISOString(),
    idea,
    query: report.query,
  }
  const disliked = upsertEntry(state.disliked, entry)
  const liked = removeEntry(state.liked, report.id, idea.id)
  saveLibrary({ liked, disliked })
}

export const TUTORIAL_KEY = "rim:tutorial:swipe:v1"

export function hasSeenTutorial(): boolean {
  if (typeof window === "undefined") return true
  return window.localStorage.getItem(TUTORIAL_KEY) === "1"
}

export function markTutorialSeen() {
  if (typeof window === "undefined") return
  window.localStorage.setItem(TUTORIAL_KEY, "1")
}
