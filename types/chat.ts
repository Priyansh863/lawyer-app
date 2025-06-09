export interface Message {
  id: string
  content: string
  senderId: string
  receiverId: string
  timestamp: string
  isRead: boolean
  attachments: Attachment[]
  tokenCount?: number // Number of tokens used by this message
}

export interface Attachment {
  id: string
  fileName: string
  fileSize: number
  fileType: string
  url: string
}

export interface ChatSummary {
  clientId: string
  clientName: string
  clientAvatar?: string
  lastMessageTime: string
  lastMessagePreview: string
  unreadCount: number
  tokenUsage: number
}

// Schema for message creation
export const messageSchema = {
  content: {
    label: "Message",
    type: "textarea",
    required: true,
    validation: {
      maxLength: 2000,
    },
  },
  attachments: {
    label: "Attachments",
    type: "file",
    required: false,
    validation: {
      maxSize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
    },
  },
}

// Field mapping for API requests
export const messageApiMapping = {
  send: {
    content: "content",
    receiverId: "receiver_id",
    attachments: "attachments",
    tokenCount: "token_count",
  },
}
