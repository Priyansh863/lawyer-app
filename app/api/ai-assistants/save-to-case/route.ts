import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth-utils"

/**
 * POST /api/ai-assistants/save-to-case
 * Save a file and its summary to a case
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { file_id, case_id } = body

    if (!file_id || !case_id) {
      return NextResponse.json({ error: "File ID and Case ID are required" }, { status: 400 })
    }

    // In a real implementation, this would:
    // - Validate that the file and case exist
    // - Associate the file with the case in the database
    // - Update case metadata

    // Mock response
    return NextResponse.json({
      success: true,
      message: "File saved to case successfully",
      fileId: file_id,
      caseId: case_id,
    })
  } catch (error) {
    console.error("Save to case error:", error)
    return NextResponse.json({ error: "Failed to save file to case" }, { status: 500 })
  }
}
