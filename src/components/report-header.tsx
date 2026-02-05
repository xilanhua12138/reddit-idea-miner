import { useTranslations } from "next-intl"
import type { Report } from "@/lib/types"
import { LangSwitch } from "@/components/lang-switch"

export function ReportHeader(props: { report: Report; index: number; total: number }) {
  const { report, index, total } = props
  const t = useTranslations()

  return (
    <div className="mb-2 flex items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold">{t("app.name")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("report.keyword")}：<span className="font-medium text-foreground">{report.query.keyword}</span>
          {report.query.subreddit ? (
            <>
              {" "}· {t("report.subreddit")}：<span className="font-medium text-foreground">r/{report.query.subreddit}</span>
            </>
          ) : null}
          {" "}· {t("report.range")}：<span className="font-medium text-foreground">{report.query.range}</span>
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {Math.min(index + 1, total)}/{total}
        </p>
      </div>

      <LangSwitch />
    </div>
  )
}
