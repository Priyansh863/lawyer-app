import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth-utils"

/**
 * GET /api/marketing/templates
 * Get marketing templates
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // In a real implementation, this would fetch templates from a database
    // Mock response
    return NextResponse.json({
      templates: [
        {
          id: "template_1",
          name: "Christmas Post",
          description: "Holiday-themed social media post",
          type: "christmas",
          thumbnailUrl: "/christmas-template.jpg",
          defaultPrompt: "Create a festive Christmas post with snow and trees",
        },
        // More templates would be here
      ],
    })
  } catch (error) {
    console.error("Get templates error:", error)
    return NextResponse.json({ error: "Failed to retrieve templates" }, { status: 500 })
  }
}
