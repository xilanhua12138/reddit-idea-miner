"use client"

import { useLocale, useT } from "@/components/locale-provider"

export function LangSwitch() {
  const { locale, setLocale } = useLocale()
  const t = useT()

  return (
    <div className="flex items-center gap-2 text-xs">
      <button
        type="button"
        className={`rounded-md border px-2 py-1 ${locale === "en" ? "bg-foreground text-background" : "bg-background"}`}
        onClick={() => setLocale("en")}
      >
        {t("lang.en")}
      </button>
      <button
        type="button"
        className={`rounded-md border px-2 py-1 ${locale === "zh" ? "bg-foreground text-background" : "bg-background"}`}
        onClick={() => setLocale("zh")}
      >
        {t("lang.zh")}
      </button>
    </div>
  )
}
