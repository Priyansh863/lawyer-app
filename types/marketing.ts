export type PostPlatform = "linkedin" | "twitter" | "facebook" | "instagram"
export type PostStatus = "draft" | "published" | "scheduled" | "failed"
export type ContentType = "social" | "blog" | "newsletter"

export interface LegalPost {
  id: string
  title: string
  content: string
  imageUrl?: string
  hashtags?: string[]
  platforms: PostPlatform[]
  status: PostStatus
  targetRegion?: string
  contentType: ContentType
  createdAt: string
  publishedAt?: string
  scheduledFor?: string
  engagement?: {
    likes: number
    shares: number
    comments: number
    clicks: number
  }
}

export interface GenerateContentParams {
  prompt: string
  contentType: string
  options?: {
    tone?: "professional" | "conversational" | "educational"
    includeHashtags?: boolean
    includeImage?: boolean
  }
}

export interface PublishPostParams {
  postId: string
  platforms: PostPlatform[]
  targetRegion: string
  scheduledFor?: string
}

export interface PostAnalytics {
  postId: string
  platforms: {
    platform: PostPlatform
    likes: number
    shares: number
    comments: number
    clicks: number
    reach: number
    impressions: number
  }[]
  totalEngagement: number
  engagementRate: number
  topPerformingPlatform: PostPlatform
}

/**
 * Mapping between client request fields and backend API fields for sharing content
 */
export const contentGenerationApiMapping = {
  share: {
    postId: "content_id",
    platforms: "platforms",
    targetRegion: "target_region",
    scheduledFor: "scheduled_for",
  },
}
