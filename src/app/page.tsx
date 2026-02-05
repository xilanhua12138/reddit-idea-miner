import { getTranslations } from "next-intl/server"
import { HomeClient } from "@/components/home-client"

export default async function HomePage() {
  const t = await getTranslations()

  return (
    <HomeClient
      labels={{
        appName: t("app.name"),
        subtitle: t("home.subtitle"),
        libraryTitle: t("library.title"),
        keyword: t("home.keyword"),
        keywordPh: t("home.keyword_ph"),
        subreddit: t("home.subreddit"),
        subredditPh: t("home.subreddit_ph"),
        range: t("home.range"),
        rangeWeek: t("range.week"),
        rangeMonth: t("range.month"),
        rangeYear: t("range.year"),
        generate: t("home.generate"),
        generating: t("home.generating"),
        keywordRequired: t("errors.keyword_required"),
        genericFail: t("errors.generic_fail"),
      }}
    />
  )
}
