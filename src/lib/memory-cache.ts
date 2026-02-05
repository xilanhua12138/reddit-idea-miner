/* eslint-disable @typescript-eslint/no-explicit-any */
import { LRUCache } from "lru-cache"

// Global singleton across hot reloads
const g = globalThis as unknown as {
  __rim_cache?: LRUCache<string, any>
  __rim_rl?: Map<string, { count: number; resetAt: number }>
}

export const cache =
  g.__rim_cache ??
  (g.__rim_cache = new LRUCache<string, any>({
    max: 500,
    ttl: 1000 * 60 * 10, // 10 min default
  }))

export function rateLimit(ip: string, limit = 30, windowMs = 5 * 60 * 1000) {
  const now = Date.now()
  const store = g.__rim_rl ?? (g.__rim_rl = new Map())
  const cur = store.get(ip)
  if (!cur || cur.resetAt <= now) {
    store.set(ip, { count: 1, resetAt: now + windowMs })
    return { ok: true, remaining: limit - 1, resetAt: now + windowMs }
  }

  if (cur.count >= limit) {
    return { ok: false, remaining: 0, resetAt: cur.resetAt }
  }

  cur.count += 1
  store.set(ip, cur)
  return { ok: true, remaining: Math.max(0, limit - cur.count), resetAt: cur.resetAt }
}
