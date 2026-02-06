/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Quote, Range } from "@/lib/types"

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

export async function gatherRedditData(params: {
  keyword: string
  subreddit?: string
  range: Range
  fetchSearch: () => Promise<RedditListing>
  fetchComments: (postId: string) => Promise<RedditComments>
}): Promise<{ quotes: Quote[]; stats: { posts: number; comments: number } }> {
  const { fetchSearch, fetchComments } = params

  const listing = await fetchSearch()
  const posts = listing.data.children
    .map((c) => c.data)
    .filter(Boolean)
    .filter((p) => p.id && p.subreddit)
    .slice(0, 15) // Limit posts to reduce API calls

  const quotes: Quote[] = []
  let commentCount = 0

  for (const p of posts) {
    const postId = String(p.id)
    const sub = String(p.subreddit)

    const selftext = pickNonEmpty(p.selftext)
    if (selftext) {
      quotes.push({
        kind: "post",
        text: normalizeQuoteText(selftext).slice(0, 800),
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
      .slice(0, 20) // Top 20 comments per post

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

  return {
    quotes,
    stats: { posts: posts.length, comments: commentCount },
  }
}
