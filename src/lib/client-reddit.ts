/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Range } from "@/lib/types"

// Client-side fetch from the user's browser IP (often not blocked like serverless).
const BASES = ["https://www.reddit.com", "https://old.reddit.com"]

export function buildSearchUrl(base: string, params: {
  keyword: string
  subreddit?: string
  range: Range
  limit?: number
}) {
  const { keyword, subreddit, range, limit = 50 } = params
  const q = encodeURIComponent(keyword)
  const t = encodeURIComponent(range)
  const lim = String(limit)

  if (subreddit) {
    const sub = encodeURIComponent(subreddit)
    return `${base}/r/${sub}/search.json?q=${q}&restrict_sr=1&sort=relevance&t=${t}&limit=${lim}`
  }

  return `${base}/search.json?q=${q}&sort=relevance&t=${t}&limit=${lim}`
}

export function buildCommentsUrl(base: string, postId: string) {
  const id = encodeURIComponent(postId)
  return `${base}/comments/${id}.json?raw_json=1`
}

export async function redditJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Reddit fetch failed ${res.status}: ${text.slice(0, 200)}`)
  }
  return (await res.json()) as T
}

export async function redditTryBases<T>(builder: (base: string) => string): Promise<T> {
  let lastErr: any
  for (const base of BASES) {
    try {
      const url = builder(base)
      return await redditJson<T>(url)
    } catch (e) {
      lastErr = e
    }
  }
  throw lastErr
}
