import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth-utils"
import { getCases, createCase } from "@/lib/api/cases-api"
import { caseApiMapping } from "@/types/case"

/**
 * GET /api/cases
 * Get cases with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(request.url)
    const status = url.searchParams.get("status") || "all"
    const query = url.searchParams.get("query") || ""
    const page = Number.parseInt(url.searchParams.get("page") || "1")
    const limit = Number.parseInt(url.searchParams.get("limit") || "10")

    const cases = await getCases({
      status: status as any,
      query,
      page,
      limit,
    })

    return NextResponse.json({ cases })
  } catch (error) {
    console.error("Get cases error:", error)
    return NextResponse.json({ error: "Failed to retrieve cases" }, { status: 500 })
  }
}

/**
 * POST /api/cases
 * Create a new case
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    // Map request fields to API fields using the mapping
    const apiData: Record<string, any> = {}
    for (const [clientField, apiField] of Object.entries(caseApiMapping.create)) {
      if (body[clientField] !== undefined) {
        apiData[apiField] = body[clientField]
      }
    }

    const newCase = await createCase(apiData)

    return NextResponse.json({ case: newCase }, { status: 201 })
  } catch (error) {
    console.error("Create case error:", error)
    return NextResponse.json({ error: "Failed to create case" }, { status: 500 })
  }
}
