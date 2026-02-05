import en from "../../messages/en.json"
import zh from "../../messages/zh.json"

export type Locale = "en" | "zh"
export type Messages = Record<string, string>

export const DICTS: Record<Locale, Messages> = {
  en: en as Messages,
  zh: zh as Messages,
}
