export type ActivityType = "chat" | "video" | "document" | "blog" | "case" | "appointment"

export interface Activity {
  id: string
  type: ActivityType
  title: string
  description: string
  timestamp: string
  relatedId?: string
  metadata?: Record<string, any>
}
