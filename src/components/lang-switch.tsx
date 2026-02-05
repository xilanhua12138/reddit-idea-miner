"use client"

import { useEffect, useState } from "react"

type Locale = "en" | "zh"
const COOKIE = "rim_locale"

function getCookie(name: string) {
  if (typeof document === "undefined") return null
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return m ? decodeURIComponent(m[1]) : null
}

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${60 * 60 * 24 * 365}`
}

const labels = {
  en: { en: "EN", zh: "中文" },
  zh: { en: "EN", zh: "中文" },
}

export function LangSwitch() {
  const [locale, setLocale] = useState<Locale>("en")

  useEffect(() => {
    const c = getCookie(COOKIE)
    if (c === "zh" || c === "en") setLocale(c)
  }, [])

  function change(next: Locale) {
    setCookie(COOKIE, next)
    setLocale(next)
    window.location.reload()
  }

  const t = labels[locale]

  return (
    <div className="flex items-center gap-2 text-xs">
      <button
        type="button"
        className={`rounded-md border px-2 py-1 ${locale === "en" ? "bg-foreground text-background" : "bg-background"}`}
        onClick={() => change("en")}
      >
        {t.en}
      </button>
      <button
        type="button"
        className={`rounded-md border px-2 py-1 ${locale === "zh" ? "bg-foreground text-background" : "bg-background"}`}
        onClick={() => change("zh")}
      >
        {t.zh}
      </button>
    </div>
  )
}
