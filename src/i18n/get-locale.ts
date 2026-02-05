import { cookies } from "next/headers"

export type Locale = "en" | "zh"

const COOKIE = "rim_locale"

export function getLocale(): Locale {
  const c = cookies().get(COOKIE)?.value
  if (c === "zh" || c === "en") return c
  // User requested: default English.
  return "en"
}
