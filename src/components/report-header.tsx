import type { Report } from "@/lib/types"
import { LangSwitch } from "@/components/lang-switch"

const labels = {
  appName: "Reddit Idea Miner",
  keyword: "Keyword",
  subreddit: "Subreddit",
  range: "Time range",
}

export function ReportHeader(props: { report: Report; index: number; total: number }) {
  const { report, index, total } = props

  return (
    <div className="mb-2 flex items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold">{labels.appName}</h1>
        <p className="text-sm text-muted-foreground">
          {labels.keyword}: <span className="font-medium text-foreground">{report.query.keyword}</span>
          {report.query.subreddit ? (
            <>
              {" "}· {labels.subreddit}: <span className="font-medium text-foreground">r/{report.query.subreddit}</span>
            </>
          ) : null}
          {" "}· {labels.range}: <span className="font-medium text-foreground">{report.query.range}</span>
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {Math.min(index + 1, total)}/{total}
        </p>
      </div>

      <LangSwitch />
    </div>
  )
}
