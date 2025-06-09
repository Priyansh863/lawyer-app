import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth-utils"

interface RouteParams {
  params: {
    id: string
  }
}

/**
 * GET /api/voice-summary/[id]/download
 * Download a voice recording summary
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const recordingId = params.id

    // In a real implementation, this would:
    // - Retrieve the recording and its summary
    // - Generate a downloadable file
    // - Return it with appropriate headers

    // For this mock implementation, we'll just return a text response
    const summary = `This is a mock summary for recording ${recordingId}.
    
It contains multiple paragraphs of text that summarize the content of the recording.

Key points:
- First important point from the recording
- Second important point from the recording
- Third important point from the recording

Action items:
1. Follow up with client about project timeline
2. Schedule meeting with team to discuss implementation
3. Prepare documentation for next phase

Generated on ${new Date().toISOString()} by AI Summary System.`

    // Create a text file response
    const encoder = new TextEncoder()
    const data = encoder.encode(summary)

    return new NextResponse(data, {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
        "Content-Disposition": `attachment; filename="summary_${recordingId}.txt"`,
      },
    })
  } catch (error) {
    console.error("Download summary error:", error)
    return NextResponse.json({ error: "Failed to download summary" }, { status: 500 })
  }
}
