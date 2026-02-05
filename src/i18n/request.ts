import { cookies } from "next/headers"
import { getRequestConfig } from "next-intl/server"

// Inline messages to avoid import issues during static generation
const enMessages = {
  "app.name": "Reddit Idea Miner",
  "home.subtitle": "Generate 10 evidence-backed product ideas from real Reddit JSON.",
  "home.keyword": "Keyword *",
  "home.keyword_ph": "e.g. table of contents",
  "home.subreddit": "Subreddit (optional)",
  "home.subreddit_ph": "e.g. productivity",
  "home.range": "Time range",
  "range.week": "Week",
  "range.month": "Month",
  "range.year": "Year",
  "home.generate": "Generate report",
  "home.generating": "Generating…",
  "report.keyword": "Keyword",
  "report.subreddit": "Subreddit",
  "report.range": "Time range",
  "report.done_title": "All done",
  "report.done_cta": "You've swiped them all. Go to Library to review.",
  "report.hint": "Swipe left to Nope, right to Like (←/→).",
  "tabs.evidence": "Evidence",
  "tabs.insight": "Insight",
  "tabs.build": "Build",
  "tabs.actions": "Actions",
  "evidence.source": "Source",
  "evidence.more": "Show more",
  "evidence.less": "Show less",
  "nav.home": "Home",
  "library.title": "Library",
  "library.subtitle": "Stored locally in your browser.",
  "library.from": "From",
  "library.liked": "Liked",
  "library.disliked": "Disliked",
  "library.empty": "Nothing here yet.",
  "tutorial.line1": "Swipe right to Like · left to Nope",
  "tutorial.line2": "Details are shown inside the card",
  "tutorial.gotit": "Got it",
  "tutorial.keys": "Shortcuts: ← Nope, → Like",
  "errors.keyword_required": "Keyword is required.",
  "errors.generic_fail": "Failed. If you see Reddit 403, try again or switch time range/subreddit.",
  "lang.en": "EN",
  "lang.zh": "中文"
}

const zhMessages = {
  "app.name": "Reddit Idea Miner",
  "home.subtitle": "基于真实 Reddit 讨论，生成 10 个可核验的产品点子。",
  "home.keyword": "关键词 *",
  "home.keyword_ph": "例如：table of contents",
  "home.subreddit": "子版块（可选）",
  "home.subreddit_ph": "例如：productivity",
  "home.range": "时间范围",
  "range.week": "近一周",
  "range.month": "近一月",
  "range.year": "近一年",
  "home.generate": "生成报告",
  "home.generating": "生成中…",
  "report.keyword": "关键词",
  "report.subreddit": "子版块",
  "report.range": "时间范围",
  "report.done_title": "已完成",
  "report.done_cta": "已经全部滑完。去我的库查看喜欢/不喜欢。",
  "report.hint": "左滑不喜欢，右滑喜欢（←/→）。",
  "tabs.evidence": "证据",
  "tabs.insight": "洞察",
  "tabs.build": "构建",
  "tabs.actions": "行动",
  "evidence.source": "来源",
  "evidence.more": "展开更多",
  "evidence.less": "收起",
  "nav.home": "返回主页",
  "library.title": "我的库",
  "library.subtitle": "保存在你的浏览器本地。",
  "library.from": "来自",
  "library.liked": "喜欢",
  "library.disliked": "不喜欢",
  "library.empty": "这里还没有内容。",
  "tutorial.line1": "右滑喜欢 · 左滑不喜欢",
  "tutorial.line2": "卡片里直接看详情",
  "tutorial.gotit": "知道了",
  "tutorial.keys": "快捷键：← 不喜欢，→ 喜欢",
  "errors.keyword_required": "关键词不能为空。",
  "errors.generic_fail": "失败了。如果看到 Reddit 403，建议重试或切换时间范围/子版块。",
  "lang.en": "EN",
  "lang.zh": "中文"
}

const COOKIE = "rim_locale"

type Locale = "en" | "zh"

const messagesByLocale: Record<Locale, typeof enMessages> = {
  en: enMessages,
  zh: zhMessages,
}

function normalizeLocale(v: string | undefined | null): Locale {
  return v === "zh" ? "zh" : "en"
}

export default getRequestConfig(async () => {
  // During static generation, cookies() may not work; default to 'en'
  let locale: Locale = "en"
  try {
    const cookieStore = cookies()
    const cookieValue = cookieStore.get(COOKIE)?.value
    locale = normalizeLocale(cookieValue)
  } catch {
    // Static generation or no cookies available
  }

  return {
    locale,
    messages: messagesByLocale[locale],
  }
})
