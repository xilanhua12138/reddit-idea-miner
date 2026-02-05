-- Reddit Idea Miner V1
-- Run this in Supabase SQL Editor (Project -> SQL -> New query)

create table if not exists public.reports (
  id text primary key,
  created_at timestamptz not null default now(),
  keyword text not null,
  subreddit text null,
  range text not null,
  report jsonb not null
);

create index if not exists reports_created_at_idx on public.reports (created_at desc);
