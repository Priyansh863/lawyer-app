import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth-utils"
import { getClientCases } from "@/lib/api/clients-api"

interface RouteParams {
  params: {
    id: string
  }
}

/**
 * GET /api/clients/[id]/cases
 * Get cases for a specific client
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const cases = await getClientCases(params.id)

    return NextResponse.json({ cases })
  } catch (error) {
    console.error("Get client cases error:", error)
    return NextResponse.json({ error: "Failed to retrieve client cases" }, { status: 500 })
  }
}
