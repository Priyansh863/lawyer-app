// Backend Message Schema
export interface Message {
  _id: string
  chatId: string
  senderId: string
  content: string
  messageType: 'text' | 'image' | 'file'
  isRead: boolean
  readBy: string[] // Array of user IDs who read
  createdAt: string
  updatedAt?: string
  attachments?: Attachment[]
  tokenCount?: number
}

// Backend Chat Schema
export interface Chat {
  _id: string
  participants: string[] // User IDs
  lastMessage?: string // Reference to last message ID
  createdAt: string
  updatedAt: string
  unreadCount?: number
  participantDetails?: {
    _id: string
    first_name: string
    last_name: string
    email: string
    account_type: 'client' | 'lawyer'
    avatar?: string
  }[]
}

export interface Attachment {
  id: string
  fileName: string
  fileSize: number
  fileType: string
  url: string
}

// API Response Types
export interface ChatResponse {
  success: boolean
  message: string
  data: {
    _id: string
    participants: any[]
    createdAt: string
  }
}

export interface ChatsResponse {
  success: boolean
  message: string
  data: {
    chats: Chat[]
    pagination: {
      currentPage: number
      totalPages: number
      totalChats: number
    }
  }
}

export interface MessagesResponse {
  success: boolean
  data: {
    messages: Message[]
    pagination: {
      currentPage: number
      totalPages: number
      totalMessages: number
    }
  }
}

// Socket.IO Event Types
export interface SocketEvents {
  // Client to Server
  join_chat: (chatId: string) => void
  leave_chat: (chatId: string) => void
  send_message: (data: { chatId: string; message: string; messageType?: string }) => void
  start_typing: (data: { chatId: string }) => void
  stop_typing: (data: { chatId: string }) => void
  mark_as_read: (data: { chatId: string }) => void

  // Server to Client
  new_message: (data: { message: Message; chatId: string; sender: any }) => void
  user_typing: (data: { userId: string; chatId: string; isTyping: boolean }) => void
  message_read: (data: { chatId: string; userId: string; messageIds: string[] }) => void
  user_status: (data: { userId: string; isOnline: boolean }) => void
  error: (error: { message: string }) => void
}

// UI Helper Types
export interface ChatSummary {
  chatId: string
  participantName: string
  participantAvatar?: string
  lastMessageTime: string
  lastMessagePreview: string
  unreadCount: number
  isOnline?: boolean
}

export interface TypingUser {
  userId: string
  chatId: string
  isTyping: boolean
}

export interface OnlineUser {
  userId: string
  isOnline: boolean
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
