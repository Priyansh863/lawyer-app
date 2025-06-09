import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth-utils"
import { getCaseById, updateCaseStatus } from "@/lib/api/cases-api"
import { caseApiMapping } from "@/types/case"

interface RouteParams {
  params: {
    id: string
  }
}

/**
 * GET /api/cases/[id]
 * Get a case by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const caseData = await getCaseById(params.id)

    if (!caseData) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 })
    }

    return NextResponse.json({ case: caseData })
  } catch (error) {
    console.error("Get case error:", error)
    return NextResponse.json({ error: "Failed to retrieve case" }, { status: 500 })
  }
}

/**
 * PATCH /api/cases/[id]
 * Update a case
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    // Map request fields to API fields using the mapping
    const apiData: Record<string, any> = { case_id: params.id }
    for (const [clientField, apiField] of Object.entries(caseApiMapping.update)) {
      if (body[clientField] !== undefined) {
        apiData[apiField] = body[clientField]
      }
    }

    // If status is being updated, use the dedicated function
    if (body.status) {
      const updatedCase = await updateCaseStatus(params.id, body.status)
      return NextResponse.json({ case: updatedCase })
    }

    // Otherwise, this would call a general update function
    return NextResponse.json({ error: "Not implemented" }, { status: 501 })
  } catch (error) {
    console.error("Update case error:", error)
    return NextResponse.json({ error: "Failed to update case" }, { status: 500 })
  }
}
