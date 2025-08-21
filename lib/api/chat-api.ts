import axios from 'axios'
import type { 
  Message, 
  Chat, 
  ChatResponse, 
  ChatsResponse, 
  MessagesResponse,
  ChatSummary 
} from '@/types/chat'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'

// Helper function to get auth headers

const getToken = () => {
  if (typeof window !== "undefined") {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user).token : null;
  }
  return null;
};

const getAuthHeaders = () => {
  if (typeof window === 'undefined') return {}
  
  const token = getToken()
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
}

// Helper function to get current user ID
const getCurrentUserId = (): string | null => {
  if (typeof window === 'undefined') return null
  
  const userStr = localStorage.getItem('user')
  if (!userStr) return null
  
  try {
    const user = JSON.parse(userStr)
    return user._id || user.id
  } catch {
    return null
  }
}

interface GetChatsParams {
  query?: string
  page?: number
  limit?: number
}

interface CreateChatParams {
  lawyerId: string
}

interface SendMessageParams {
  chatId: string
  message: string
  messageType?: 'text' | 'image' | 'file'
}

/**
 * Create a new chat
 */
export async function createChat({ lawyerId }: CreateChatParams): Promise<ChatResponse> {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/chat/create`,
      { lawyerId },
      { headers: getAuthHeaders() }
    )
    console.log(response.data,"responseresponseresponseresponseresponseresponse")
    return response.data
  } catch (error: any) {
    console.log(error,"errorerrorerrorerrorerrorerrorerrorerror")
    console.error('Create chat error:', error)
    throw new Error(error.response?.data?.message || 'Failed to create chat')
  }
}

/**
 * Get user's chats with pagination
 */
export async function getChats({ query = '', page = 1, limit = 20 }: GetChatsParams = {}){
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    })
    
    if (query) {
      params.append('query', query)
    }

    const response = await axios.get(
      `${API_BASE_URL}/chat/my-chats?${params.toString()}`,
      { headers: getAuthHeaders() }
    )
    return response.data
  } catch (error: any) {
    console.error('Get chats error:', error)
    throw new Error(error.response?.data?.message || 'Failed to fetch chats')
  }
}

/**
 * Get messages for a specific chat
 */
export async function getChatMessages(chatId: string, page = 1, limit = 50): Promise<MessagesResponse> {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    })

    const response = await axios.get(
      `${API_BASE_URL}/chat/${chatId}/messages?${params.toString()}`,
      { headers: getAuthHeaders() }
    )
    return response.data
  } catch (error: any) {
    console.error('Get messages error:', error)
    throw new Error(error.response?.data?.message || 'Failed to fetch messages')
  }
}

/**
 * Send a message (REST fallback)
 */
export async function sendMessage({ chatId, message, messageType = 'text' }: SendMessageParams): Promise<Message> {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/chat/${chatId}/send`,
      { message, messageType },
      { headers: getAuthHeaders() }
    )
    return response.data.data
  } catch (error: any) {
    console.error('Send message error:', error)
    throw new Error(error.response?.data?.message || 'Failed to send message')
  }
}

/**
 * Mark all messages in a chat as read
 */
export async function markMessagesAsRead(chatId: string): Promise<void> {
  try {
    await axios.post(
      `${API_BASE_URL}/chat/${chatId}/read`,
      {},
      { headers: getAuthHeaders() }
    )
  } catch (error: any) {
    console.error('Mark as read error:', error)
    throw new Error(error.response?.data?.message || 'Failed to mark messages as read')
  }
}

/**
 * Mark messages as read (alias for compatibility)
 */
export const markAsRead = markMessagesAsRead

/**
 * Delete a chat
 */
export async function deleteChat(chatId: string): Promise<void> {
  try {
    await axios.delete(
      `${API_BASE_URL}/chat/${chatId}`,
      { headers: getAuthHeaders() }
    )
  } catch (error: any) {
    console.error('Delete chat error:', error)
    throw new Error(error.response?.data?.message || 'Failed to delete chat')
  }
}

/**
 * Search chats
 */
export async function searchChats(query: string, page = 1, limit = 20): Promise<ChatsResponse> {
  try {
    const params = new URLSearchParams({
      query,
      page: page.toString(),
      limit: limit.toString()
    })

    const response = await axios.get(
      `${API_BASE_URL}/chat/search?${params.toString()}`,
      { headers: getAuthHeaders() }
    )
    return response.data
  } catch (error: any) {
    console.error('Search chats error:', error)
    throw new Error(error.response?.data?.message || 'Failed to search chats')
  }
}

/**
 * Get chat summary
 */
export async function getChatSummary(chatId: string): Promise<{ summary: string; keyPoints: string[]; tokenUsage: number }> {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/chat/${chatId}/summary`,
      { headers: getAuthHeaders() }
    )
    return response.data.data
  } catch (error: any) {
    console.error('Get chat summary error:', error)
    throw new Error(error.response?.data?.message || 'Failed to get chat summary')
  }
}

/**
 * Get unread message count
 */
export async function getUnreadCount(): Promise<{ count: number }> {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/chat/unread-count`,
      { headers: getAuthHeaders() }
    )
    return response.data.data
  } catch (error: any) {
    console.error('Get unread count error:', error)
    throw new Error(error.response?.data?.message || 'Failed to get unread count')
  }
}

/**
 * Transform backend chat data to UI-friendly format
 */
export function transformChatToSummary(chat: Chat, currentUserId: string): ChatSummary {
  // Find the other participant (not current user)
  const otherParticipant = chat.participantDetails?.find(p => p._id !== currentUserId)
  
  return {
    chatId: chat._id,
    participantName: otherParticipant 
      ? `${otherParticipant.first_name} ${otherParticipant.last_name}`.trim()
      : 'Unknown User',
    participantAvatar: otherParticipant?.avatar,
    lastMessageTime: chat.updatedAt,
    lastMessagePreview: '', // Will be populated from last message
    unreadCount: chat.unreadCount || 0,
    isOnline: false // Will be updated via Socket.IO
  }
}
