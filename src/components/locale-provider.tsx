"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"
import type { Locale, Messages } from "@/lib/i18n-dicts"
import { DICTS } from "@/lib/i18n-dicts"
import { getClientLocaleCookie, setClientLocaleCookie } from "@/lib/locale-cookie"

type Ctx = {
  locale: Locale
  setLocale: (l: Locale) => void
  messages: Messages
}

const LocaleContext = createContext<Ctx | null>(null)

export function LocaleProvider(props: { children: React.ReactNode }) {
  // Always start in English to avoid rendering raw keys on first paint.
  const [locale, setLocaleState] = useState<Locale>("en")

  useEffect(() => {
    setLocaleState(getClientLocaleCookie())
  }, [])

  function setLocale(l: Locale) {
    setClientLocaleCookie(l)
    setLocaleState(l)
  }

  const messages = DICTS[locale]

  const value = useMemo(() => ({ locale, setLocale, messages }), [locale, messages])

  return <LocaleContext.Provider value={value}>{props.children}</LocaleContext.Provider>
}

export function useLocale() {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error("useLocale must be used within <LocaleProvider>")
  return ctx
}

export function useT() {
  const { messages } = useLocale()
  return (key: string) => messages[key] ?? DICTS.en[key] ?? key
}
