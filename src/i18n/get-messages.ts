import type { Locale } from "@/i18n/get-locale"

export async function getMessages(locale: Locale) {
  const mod = await import(`../../messages/${locale}.json`)
  return mod.default as Record<string, string>
}
