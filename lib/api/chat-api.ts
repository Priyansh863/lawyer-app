import type { Message, ChatSummary } from "@/types/chat"

interface GetChatsParams {
  query?: string
  page?: number
  limit?: number
}

/**
 * Get chat summaries with optional filtering
 */
export async function getChats({ query = "", page = 1, limit = 10 }: GetChatsParams = {}): Promise<ChatSummary[]> {
  // this would call an API endpoint
  // This is a mock implementation for demonstration

  // Mock data
  const mockChats: ChatSummary[] = [
    {
      clientId: "client_1",
      clientName: "John Doe",
      clientAvatar: "/placeholder.svg?height=40&width=40",
      lastMessageTime: "2025-03-24T10:00:00Z",
      lastMessagePreview: "Hello, I need help with my case.",
      unreadCount: 0,
      tokenUsage: 236,
    },
    {
      clientId: "client_2",
      clientName: "John Doe",
      clientAvatar: "/placeholder.svg?height=40&width=40",
      lastMessageTime: "2025-03-24T09:30:00Z",
      lastMessagePreview: "Can you review the contract?",
      unreadCount: 2,
      tokenUsage: 124,
    },
    {
      clientId: "client_3",
      clientName: "John Doe",
      clientAvatar: "/placeholder.svg?height=40&width=40",
      lastMessageTime: "2025-03-24T09:00:00Z",
      lastMessagePreview: "Thank you for your help.",
      unreadCount: 0,
      tokenUsage: 236,
    },
    {
      clientId: "client_4",
      clientName: "John Doe",
      clientAvatar: "/placeholder.svg?height=40&width=40",
      lastMessageTime: "2025-03-24T08:30:00Z",
      lastMessagePreview: "I'll send the documents tomorrow.",
      unreadCount: 0,
      tokenUsage: 124,
    },
    {
      clientId: "client_5",
      clientName: "John Doe",
      clientAvatar: "/placeholder.svg?height=40&width=40",
      lastMessageTime: "2025-03-24T08:00:00Z",
      lastMessagePreview: "When is our next meeting?",
      unreadCount: 1,
      tokenUsage: 98,
    },
    {
      clientId: "client_6",
      clientName: "John Doe",
      clientAvatar: "/placeholder.svg?height=40&width=40",
      lastMessageTime: "2025-03-24T07:30:00Z",
      lastMessagePreview: "I have a question about the case.",
      unreadCount: 0,
      tokenUsage: 63,
    },
  ]

  // Filter by search query
  let filteredChats = mockChats
  if (query) {
    const lowerQuery = query.toLowerCase()
    filteredChats = filteredChats.filter(
      (c) => c.clientName.toLowerCase().includes(lowerQuery) || c.lastMessagePreview.toLowerCase().includes(lowerQuery),
    )
  }

  // Pagination
  const startIndex = (page - 1) * limit
  const endIndex = startIndex + limit
  const paginatedChats = filteredChats.slice(startIndex, endIndex)

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  return paginatedChats
}

/**
 * Get messages for a specific chat
 */
export async function getMessages(clientId: string): Promise<Message[]> {
  // this would call an API endpoint
  // This is a mock implementation for demonstration

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 700))

  // For AI assistant, return specific messages
  if (clientId === "ai_assistant") {
    return [
      {
        id: "ai_msg_1",
        content: "Hello! I'm your AI legal assistant. How can I help you today?",
        senderId: "ai_assistant",
        receiverId: "current_user",
        timestamp: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
        isRead: true,
        attachments: [],
        tokenCount: 15,
      },
    ]
  }

  // For regular clients, return mock conversation
  return [
    {
      id: "msg_1",
      content: "Hello, I need help with my case.",
      senderId: clientId,
      receiverId: "current_user",
      timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      isRead: true,
      attachments: [],
      tokenCount: 8,
    },
    {
      id: "msg_2",
      content: "Of course, I'd be happy to help. Could you provide more details about your case?",
      senderId: "current_user",
      receiverId: clientId,
      timestamp: new Date(Date.now() - 3540000).toISOString(), // 59 minutes ago
      isRead: true,
      attachments: [],
      tokenCount: 18,
    },
    {
      id: "msg_3",
      content: "Please show me the link of Sigma of AI Legal",
      senderId: clientId,
      receiverId: "current_user",
      timestamp: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
      isRead: true,
      attachments: [],
      tokenCount: 10,
    },
  ]
}

/**
 * Send a message
 */
export async function sendMessage(message: Message): Promise<Message> {
  // this would call an API endpoint
  // This is a mock implementation for demonstration

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  // Return the message with a server-generated ID
  return {
    ...message,
    id: `msg_${Date.now()}`,
  }
}

/**
 * Mark messages as read
 */
export async function markAsRead(messageIds: string[]): Promise<void> {
  //this would call an API endpoint
  // This is a mock implementation for demonstration

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300))

  //this would update the messages in the database
  console.log(`Marked messages as read: ${messageIds.join(", ")}`)
}

/**
 * End a chat session
 */
export async function endChatSession(clientId: string): Promise<void> {
  // this would call an API endpoint
  // This is a mock implementation for demonstration

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 800))

  // this would update the chat session in the database
  console.log(`Ended chat session with client: ${clientId}`)
}

/**
 * Get chat session summary
 */
export async function getChatSummary(clientId: string): Promise<{
  summary: string
  keyPoints: string[]
  tokenUsage: number
}> {
  // this would call an API endpoint
  // This is a mock implementation for demonstration

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // Return mock summary
  return {
    summary:
      "This conversation covered legal consultation topics. The client asked questions about their case, and the AI assistant provided guidance and information.",
    keyPoints: [
      "Client inquired about legal procedures",
      "Information was provided about documentation requirements",
      "Next steps were outlined for the client's case",
      "Follow-up actions were recommended",
    ],
    tokenUsage: 236,
  }
}
