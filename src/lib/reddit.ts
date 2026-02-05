import { cache } from "@/lib/memory-cache"

export type Range = "week" | "month" | "year"

// Reddit often blocks server-side requests to www.reddit.com with 403.
// old.reddit.com is typically more tolerant for JSON endpoints.
const BASE = "https://old.reddit.com"

function ua() {
  return (
    process.env.REDDIT_USER_AGENT ||
    // A browser-like UA reduces 403 blocks.
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36 RedditIdeaMiner/1.0"
  )
}

export async function redditFetchJson<T>(url: string): Promise<T> {
  const key = `reddit:${url}`
  const hit = cache.get(key) as T | undefined
  if (hit) return hit

  const res = await fetch(url, {
    headers: {
      "User-Agent": ua(),
      Accept: "application/json",
      "Accept-Language": "en-US,en;q=0.9",
    },
    // Reddit can be sensitive to caching; we do our own
    cache: "no-store",
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Reddit fetch failed ${res.status} ${res.statusText}: ${text.slice(0, 200)}`)
  }

  const data = (await res.json()) as T
  cache.set(key, data, { ttl: 1000 * 60 * 10 })
  return data
}

export function buildSearchUrl(params: {
  keyword: string
  subreddit?: string
  range: Range
  limit?: number
}) {
  const { keyword, subreddit, range, limit = 25 } = params
  const q = encodeURIComponent(keyword)
  const t = encodeURIComponent(range)
  const lim = String(limit)

  if (subreddit) {
    const sub = encodeURIComponent(subreddit)
    return `${BASE}/r/${sub}/search.json?q=${q}&restrict_sr=1&sort=relevance&t=${t}&limit=${lim}`
  }

  return `${BASE}/search.json?q=${q}&sort=relevance&t=${t}&limit=${lim}`
}

export function buildCommentsUrl(postId: string) {
  const id = encodeURIComponent(postId)
  return `${BASE}/comments/${id}.json?raw_json=1`
}
