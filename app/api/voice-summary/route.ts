import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth-utils"
import { voiceRecordingApiMapping } from "@/types/voice-summary"

/**
 * GET /api/voice-summary
 * Get voice recordings
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // In a real implementation, this would fetch recordings from a database
    // Mock response
    return NextResponse.json({
      recordings: [
        {
          id: "rec_1",
          title: "Acme Co.",
          createdBy: "Harold",
          createdAt: "2025-02-28T10:00:00Z",
          duration: "02:25",
          audioUrl: "/mock-audio-1.mp3",
          transcription: "This is a mock transcription for the first recording.",
          summary: "Summary of the first recording discussing Acme Co. business matters.",
        },
        
      ],
    })
  } catch (error) {
    console.error("Get recordings error:", error)
    return NextResponse.json({ error: "Failed to retrieve recordings" }, { status: 500 })
  }
}

/**
 * POST /api/voice-summary
 * Upload a voice recording
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    
    // 1. Parse the form data
    const formData = await request.formData()
    const audioFile = formData.get("audio_file") as File

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 })
    }

    // 2. Map form fields to API fields using the mapping
    const apiData: Record<string, any> = { audio_file: audioFile }
    for (const [clientField, apiField] of Object.entries(voiceRecordingApiMapping.record)) {
      if (formData.has(clientField)) {
        apiData[apiField] = formData.get(clientField)
      }
    }

    // 3. In a real implementation, this would:
    //    - Upload the audio file to storage
    //    - Process the audio for transcription
    //    - Generate a summary
    //    - Store metadata in database

    // Mock response
    return NextResponse.json({
      recording: {
        id: `rec_${Date.now()}`,
        title: apiData.title || "Untitled Recording",
        createdBy: user.name,
        createdAt: new Date().toISOString(),
        duration: "00:30", // Mock duration
        audioUrl: "/mock-audio-url.mp3", // In a real app, this would be the actual URL
        transcription: "This is an automatically generated transcription of your recording.",
        summary: "This is an automatically generated summary of your recording.",
      },
    })
  } catch (error) {
    console.error("Upload recording error:", error)
    return NextResponse.json({ error: "Failed to upload recording" }, { status: 500 })
  }
}
