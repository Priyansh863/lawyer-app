import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth-utils"
import { sendMessage } from "@/lib/api/chat-api"
import { messageApiMapping } from "@/types/chat"

/**
 * POST /api/chat/messages/send
 * Send a message
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    // Map request fields to API fields using the mapping
    const apiData: Record<string, any> = {
      sender_id: user.id,
    }

    for (const [clientField, apiField] of Object.entries(messageApiMapping.send)) {
      if (body[clientField] !== undefined) {
        apiData[apiField] = body[clientField]
      }
    }

    // Validate required fields
    if (!apiData.content) {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 })
    }

    if (!apiData.receiver_id) {
      return NextResponse.json({ error: "Receiver ID is required" }, { status: 400 })
    }

    // Create message object
    const message = {
      id: `msg_${Date.now()}`,
      content: apiData.content,
      senderId: user.id,
      receiverId: apiData.receiver_id,
      timestamp: new Date().toISOString(),
      isRead: false,
      attachments: apiData.attachments || [],
    }

    // Send message
    const sentMessage = await sendMessage(message)

    return NextResponse.json({ message: sentMessage })
  } catch (error) {
    console.error("Send message error:", error)
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
}
