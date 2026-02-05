# Reddit Idea Miner — V1 PRD (Deployable)

> Goal: A public “tool site” that generates **10 evidence-backed product ideas** from real Reddit discussions.
> 
> **Hard constraint:** Evidence quotes must be pulled from real Reddit JSON endpoints. No invented quotes.

## 1. Positioning
A lightweight research tool for indie hackers/PMs: enter a keyword (optional subreddit + time range), generate a shareable report of 10 product ideas with verifiable Reddit quotes.

## 2. V1 Scope
### In scope
- Next.js 14 **App Router** + TypeScript
- TailwindCSS
- UI: shadcn/ui (Radix + Tailwind) with a clean style inspired by https://kumo-ui.com/
- Deploy to **Vercel free tier**
- Persistent report storage using **Supabase (free tier)**
- Public, no auth
- Home page form → generate report → shareable URL `/r/<reportId>`
- Report page with 10 idea cards; clicking opens right-side drawer (Sheet)
- Evidence quotes (3–7 per idea) from Reddit JSON
- Simple scoring: pain/repeat/pay/total
- Server routes under `/api`:
  - Reddit JSON fetch (User-Agent)
  - In-memory caching and basic rate limiting
  - Report generation + persistence

### Out of scope
- User accounts
- Paid plans
- Full-text search over past reports
- Multi-step conversational refinement

## 3. Persistence & “Permanent” links
User requirement: report links should be **permanent**.

Design:
- Store each report in Supabase `reports` table.
- `/r/<reportId>` reads from Supabase. No TTL expiry.
- Optional later: soft-delete or retention policy; not in V1.

## 4. Pages & UX
### 4.1 Home `/`
Form fields:
- Keyword (required)
- Subreddit (optional)
- Time range (required): week/month/year
- Generate Report

States:
- Loading (spinner)
- Error (friendly message + retry)

### 4.2 Report `/r/<reportId>`
Header:
- Query recap
- Stats: posts scanned, comments scanned, generated time

Body:
- 10 Idea Cards, each shows:
  - Title
  - One-liner
  - Badges: pain/repeat/pay/total
  - Evidence count

Drawer (right-side Sheet):
- Evidence quotes list (3–7)
- Sections:
  - Insight
  - Build
  - Actions

Link policy:
- Web UI may include an unobtrusive “View on Reddit” link per quote/post (helps verification). If you prefer “no links anywhere”, we can render as plain text.

## 5. Evidence sourcing (non-negotiable)
Endpoints:
- Search:
  - `https://www.reddit.com/search.json?q=...&t=week|month|year&sort=relevance&limit=...`
  - or `https://www.reddit.com/r/<sub>/search.json?q=...&restrict_sr=1&t=...&sort=relevance&limit=...`
- Post + comments:
  - `https://www.reddit.com/comments/<postId>.json?raw_json=1`

Rules:
- Quotes only from `selftext` or comment `body`.
- Quotes are stored verbatim (trim/normalize whitespace ok; no rewriting).
- Each quote includes metadata: subreddit, postId, commentId?, author, score, createdUtc, permalink.

## 6. Generation logic (V1 pragmatic)
Fetch:
- Search returns up to N posts (default 25–50).
- Fetch comments for top K posts (default 6–10) to limit rate/latency.
- From each post, take top M comments by score (default 20–40).

Extraction:
- Collect candidate quotes containing pain/need language.
- Cluster by keyword overlap / simple similarity (no vector DB in V1).
- Produce 10 clusters; each becomes an idea.
- Pick 3–7 quotes per idea.

Scoring (0–5 each):
- pain: complaint intensity cues
- repeat: #distinct authors/posts expressing similar issue
- pay: willingness-to-pay cues
- total: sum (or normalized)

## 7. API (Next.js route handlers)
- `POST /api/report/generate` → { reportId }
- `GET /api/report/:reportId` → report JSON
- `GET /api/reddit/search` (internal) — used by generator
- `GET /api/reddit/post` (internal) — used by generator

Rate limiting:
- Best-effort in-memory per-IP limit (sufficient for V1). Later can be moved to Upstash.

Caching:
- In-memory cache for Reddit fetches (TTL 5–15 min).

## 8. Data model
### Report
- `id: string`
- `createdAt: string`
- `query: { keyword: string; subreddit?: string; range: 'week'|'month'|'year' }`
- `stats: { posts: number; comments: number }`
- `ideas: Idea[]`

### Idea
- `id: string`
- `title: string`
- `oneLiner: string`
- `scores: { pain: number; repeat: number; pay: number; total: number }`
- `quotes: Quote[]`
- `insight: string`
- `build: string`
- `actions: string`

### Quote
- `kind: 'post'|'comment'`
- `text: string`
- `subreddit: string`
- `postId: string`
- `commentId?: string`
- `author: string`
- `score: number`
- `createdUtc: number`
- `permalink: string`

## 9. Supabase schema
Table: `reports`
- `id text primary key`
- `created_at timestamptz not null default now()`
- `keyword text not null`
- `subreddit text null`
- `range text not null`
- `report jsonb not null`

RLS policy (V1 simple):
- Enable RLS.
- Allow `select` where `id = requested` (public read-by-id).
- Allow `insert` from server only using Service Role key.

## 10. Deployment
- Host: Vercel
- Env vars:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (server-only)
  - `REDDIT_USER_AGENT`

## 11. Acceptance criteria
- Deployed URL works.
- Generating a report returns `/r/<reportId>`.
- Report shows 10 cards.
- Each card has 3–7 real quotes with metadata.
- `/r/<reportId>` remains accessible permanently (Supabase-backed).
