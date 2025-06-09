import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth-utils"

/**
 * GET /api/marketing/history
 * Get legal content post history
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // In a real implementation, this would fetch post history from a database

    // Mock response
    return NextResponse.json({
      posts: [
        {
          id: "post_1",
          title: "Holiday Greetings",
          content:
            "May your day be filled with love, laughter, and lots of holiday cheer. Whether you're unwrapping gifts or making memories, we hope this season brings warmth to your heart and joy to your home. 🎄❤️",
          imageUrl: "/christmas-template.jpg",
          hashtags: ["MerryChristmas", "HappyHolidays", "TisTheSeason", "JoyfulMoments"],
          platforms: ["linkedin", "twitter", "facebook"],
          status: "published",
          targetRegion: "California",
          contentType: "social",
          createdAt: "2025-05-17T14:30:00Z",
          publishedAt: "2025-05-17T14:35:00Z",
          engagement: {
            likes: 45,
            shares: 12,
            comments: 8,
            clicks: 23,
          },
        },
        {
          id: "post_2",
          title: "Legal Updates",
          content:
            "Important legal update: Recent changes to family law in California now require mandatory mediation before contested hearings. This aims to reduce court backlogs and promote amicable resolutions. Contact our office to understand how these changes might affect your case.",
          hashtags: ["LegalUpdate", "CaliforniaLaw", "FamilyLaw", "LegalAdvice"],
          platforms: ["linkedin", "twitter"],
          status: "published",
          targetRegion: "California",
          contentType: "social",
          createdAt: "2025-05-15T10:20:00Z",
          publishedAt: "2025-05-15T10:25:00Z",
          engagement: {
            likes: 32,
            shares: 8,
            comments: 5,
            clicks: 17,
          },
        },
        {
          id: "post_3",
          title: "Understanding Recent Changes to Family Law in California",
          content:
            "California has implemented significant changes to family law procedures, effective January 2025. These changes include mandatory mediation sessions before contested hearings can be scheduled, new guidelines for child support calculations, and streamlined processes for uncontested divorces.",
          platforms: ["linkedin"],
          status: "draft",
          contentType: "blog",
          createdAt: "2025-05-14T16:45:00Z",
        },
      ],
    })
  } catch (error) {
    console.error("Get history error:", error)
    return NextResponse.json({ error: "Failed to retrieve post history" }, { status: 500 })
  }
}
