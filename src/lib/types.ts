export type Range = "week" | "month" | "year"

export type Quote = {
  kind: "post" | "comment"
  text: string
  subreddit: string
  postId: string
  commentId?: string
  author: string
  score: number
  createdUtc: number
  permalink: string
}

export type Idea = {
  id: string
  title: string
  oneLiner: string
  scores: {
    pain: number
    repeat: number
    pay: number
    total: number
  }
  tags?: string[]
  quotes: Quote[]
  insight: string
  build: string
  actions: string
}

export type Report = {
  id: string
  createdAt: string
  query: {
    keyword: string
    subreddit?: string
    range: Range
  }
  stats: {
    posts: number
    comments: number
  }
  ideas: Idea[]
}
