import { HomeClient } from "@/components/home-client"

// Inline messages for server-side rendering
const messages = {
  appName: "Reddit Idea Miner",
  subtitle: "Generate 10 evidence-backed product ideas from real Reddit JSON.",
  libraryTitle: "Library",
  keyword: "Keyword *",
  keywordPh: "e.g. table of contents",
  subreddit: "Subreddit (optional)",
  subredditPh: "e.g. productivity",
  range: "Time range",
  rangeWeek: "Week",
  rangeMonth: "Month",
  rangeYear: "Year",
  generate: "Generate report",
  generating: "Generating…",
  keywordRequired: "Keyword is required.",
  genericFail: "Failed. If you see Reddit 403, try again or switch time range/subreddit.",
}

export default async function HomePage() {
  return (
    <HomeClient
      labels={messages}
    />
  )
}
