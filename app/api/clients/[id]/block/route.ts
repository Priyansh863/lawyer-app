import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth-utils"
import { toggleBlocked } from "@/lib/api/clients-api"

interface RouteParams {
  params: {
    id: string
  }
}

/**
 * POST /api/clients/[id]/block
 * Toggle blocked status for a client
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const isBlocked = Boolean(body.isBlocked)

    const client = await toggleBlocked(params.id, isBlocked)

    return NextResponse.json({ client })
  } catch (error) {
    console.error("Toggle blocked error:", error)
    return NextResponse.json({ error: "Failed to toggle blocked status" }, { status: 500 })
  }
}
