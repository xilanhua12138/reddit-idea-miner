/* eslint-disable @typescript-eslint/no-explicit-any */
import crypto from "crypto"
import type { Report, Range, Quote, Idea } from "@/lib/types"

type RedditListing = {
  data: {
    children: Array<{ data: any }>
  }
}

type RedditComments = any

function pickNonEmpty(s?: string | null) {
  const t = (s || "").trim()
  return t.length ? t : undefined
}

function normalizeQuoteText(t: string) {
  return t.replace(/\s+/g, " ").trim()
}

function painScore(text: string) {
  const t = text.toLowerCase()
  const cues = ["hate", "annoy", "frustr", "pain", "stuck", "can't", "cannot", "waste", "overwhelm", "hard"]
  let s = 0
  for (const c of cues) if (t.includes(c)) s += 1
  return Math.min(5, Math.max(0, Math.round((s / 2) * 2) / 2))
}

function payScore(text: string) {
  const t = text.toLowerCase()
  const cues = ["pay", "paid", "pricing", "subscription", "worth", "charge", "$", "usd"]
  let s = 0
  for (const c of cues) if (t.includes(c)) s += 1
  return Math.min(5, s)
}

function hashId(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex").slice(0, 12)
}

function groupKey(text: string) {
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((w) => w.length >= 4)

  const stop = new Set(["this", "that", "with", "from", "have", "what", "when", "your", "they", "them", "just"])
  const filtered = tokens.filter((w) => !stop.has(w))
  return filtered.slice(0, 6).join("-") || "misc"
}

export async function generateReportClient(params: {
  keyword: string
  subreddit?: string
  range: Range
  fetchSearch: () => Promise<RedditListing>
  fetchComments: (postId: string) => Promise<RedditComments>
}): Promise<Report> {
  const { keyword, subreddit, range, fetchSearch, fetchComments } = params

  const listing = await fetchSearch()
  const posts = listing.data.children
    .map((c) => c.data)
    .filter(Boolean)
    .filter((p) => p.id && p.subreddit)
    .slice(0, 10)

  const quotes: Quote[] = []
  let commentCount = 0

  for (const p of posts) {
    const postId = String(p.id)
    const sub = String(p.subreddit)

    const selftext = pickNonEmpty(p.selftext)
    if (selftext) {
      quotes.push({
        kind: "post",
        text: normalizeQuoteText(selftext).slice(0, 600),
        subreddit: sub,
        postId,
        author: String(p.author || "unknown"),
        score: Number(p.score || 0),
        createdUtc: Number(p.created_utc || 0),
        permalink: `${p.permalink || ""}`,
      })
    }

    const thread = await fetchComments(postId)
    const commentsListing = thread?.[1]?.data?.children || []
    const top = commentsListing
      .map((x: any) => x?.data)
      .filter((d: any) => d && d.body && !d.stickied)
      .sort((a: any, b: any) => Number(b.score || 0) - Number(a.score || 0))
      .slice(0, 30)

    for (const c of top) {
      const body = normalizeQuoteText(String(c.body || ""))
      if (!body) continue
      commentCount += 1
      quotes.push({
        kind: "comment",
        text: body.slice(0, 600),
        subreddit: sub,
        postId,
        commentId: String(c.id || ""),
        author: String(c.author || "unknown"),
        score: Number(c.score || 0),
        createdUtc: Number(c.created_utc || 0),
        permalink: `${c.permalink || ""}`,
      })
    }
  }

  const buckets = new Map<string, Quote[]>()
  for (const q of quotes) {
    const k = groupKey(q.text)
    const arr = buckets.get(k) || []
    arr.push(q)
    buckets.set(k, arr)
  }

  const ranked = Array.from(buckets.entries())
    .map(([k, qs]) => {
      const avgPain = qs.reduce((a, q) => a + painScore(q.text), 0) / Math.max(1, qs.length)
      return { k, qs, avgPain }
    })
    .sort((a, b) => b.avgPain - a.avgPain)

  const ideas: Idea[] = ranked.slice(0, 10).map(({ k, qs }, idx) => {
    const picked = qs.slice(0, 7)
    const pain = Math.min(5, Math.round((qs.reduce((a, q) => a + painScore(q.text), 0) / Math.max(1, qs.length)) * 2) / 2)
    const pay = Math.min(5, Math.round((qs.reduce((a, q) => a + payScore(q.text), 0) / Math.max(1, qs.length)) * 2) / 2)

    const distinctAuthors = new Set(qs.map((q) => q.author)).size
    const repeat = Math.min(5, Math.max(1, Math.round(distinctAuthors / 2)))

    const total = Math.min(15, Math.round(pain + repeat + pay))

    return {
      id: hashId(`${k}:${idx}`),
      title: `Idea ${idx + 1}: ${k.replace(/-/g, " ")}`,
      oneLiner: "A lightweight tool to reduce this recurring pain using a focused workflow.",
      scores: { pain: Number(pain), repeat: Number(repeat), pay: Number(pay), total },
      quotes: picked.slice(0, 7),
      insight: "Users repeatedly describe this as friction in their workflow. The pain shows up across multiple comments and posts.",
      build: "MVP: (1) input → (2) extract/organize → (3) output a clean artifact (template/report) with one-click sharing.",
      actions: "Launch: ship a free report, post to relevant subreddits (non-spam), write SEO pages for the keyword cluster, and record a short demo.",
    }
  })

  const reportId = hashId(`${keyword}|${subreddit || ""}|${range}|${Date.now()}`)

  return {
    id: reportId,
    createdAt: new Date().toISOString(),
    query: { keyword, subreddit, range },
    stats: { posts: posts.length, comments: commentCount },
    ideas,
  }
}
