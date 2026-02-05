import type { Locale } from "@/lib/i18n-dicts"

export const LOCALE_COOKIE = "rim_locale"

export function getClientLocaleCookie(): Locale {
  if (typeof document === "undefined") return "en"
  const m = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]*)`))
  const v = m ? decodeURIComponent(m[1]) : null
  return v === "zh" ? "zh" : "en"
}

export function setClientLocaleCookie(locale: Locale) {
  if (typeof document === "undefined") return
  document.cookie = `${LOCALE_COOKIE}=${encodeURIComponent(locale)}; Path=/; Max-Age=${60 * 60 * 24 * 365}`
}
