import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth-utils"
import { toggleFavorite } from "@/lib/api/clients-api"

interface RouteParams {
  params: {
    id: string
  }
}

/**
 * POST /api/clients/[id]/favorite
 * Toggle favorite status for a client
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const isFavorite = Boolean(body.isFavorite)

    const client = await toggleFavorite(params.id, isFavorite)

    return NextResponse.json({ client })
  } catch (error) {
    console.error("Toggle favorite error:", error)
    return NextResponse.json({ error: "Failed to toggle favorite status" }, { status: 500 })
  }
}
