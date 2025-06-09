export interface QAItem {
  id: string
  question: string
  answer: string
  client: {
    id: string
    name: string
    isAnonymous: boolean
  }
  date: string
  status: "pending" | "answered"
  likes: number
  category: string
  tags: string[]
}
