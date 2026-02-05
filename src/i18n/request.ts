import { cookies } from "next/headers"
import { getRequestConfig } from "next-intl/server"

const COOKIE = "rim_locale"

type Locale = "en" | "zh"

function normalizeLocale(v: string | undefined | null): Locale {
  return v === "zh" ? "zh" : "en"
}

export default getRequestConfig(async () => {
  const locale = normalizeLocale(cookies().get(COOKIE)?.value)
  const messages = (await import(`../../messages/${locale}.json`)).default

  return {
    locale,
    messages,
  }
})
