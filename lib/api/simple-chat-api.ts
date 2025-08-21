import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'

// Get token from localStorage
const getToken = () => {
  if (typeof window !== "undefined") {
    const user = localStorage.getItem("user")
    return user ? JSON.parse(user).token : null
  }
  return null
}

// Get auth headers
const getAuthHeaders = () => ({
  'Authorization': `Bearer ${getToken()}`,
  'Content-Type': 'application/json'
})

// Backend response interfaces (matching exact backend contract)
export interface User {
  _id: string
  first_name: string
  last_name: string
  email: string
  avatar?: string
}

export interface Message {
  _id: string
  chatId: string
  senderId: User
  content: string
  messageType: 'text' | 'image' | 'file'
  isRead: boolean
  createdAt: string
  tokenCount: number
}

export interface Chat {
  _id: string
  lawyer_id: User
  client_id: User
  lastMessage?: {
    _id: string
    content: string
    createdAt: string
  }
  unreadCount: number
  createdAt: string
  updatedAt: string
}

// API Response interfaces
interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
}

// 1. Create or Get Chat
export const createOrGetChat = async (participantId: string): Promise<any> => {
  try {
    const response = await axios.post<ApiResponse<Chat>>(
      `${API_BASE_URL}/chat/create`,
      { participantId },
      { headers: getAuthHeaders() }
    )
    console.log(response.data,"responseresponseresponseresponseresponseresponse")
    if(response.data.data){
      return response.data.data
    }
    return response.data
  } catch (error) {
    console.error('Error creating/getting chat:', error)
    throw error
  }
}

// 2. Get User's Chats
export const getUserChats = async (): Promise<Chat[]> => {
  try {
    const response = await axios.get<ApiResponse<{ chats: Chat[] }>>(
      `${API_BASE_URL}/chat/my-chats`,
      { headers: getAuthHeaders() }
    )
    return response.data.data.chats || []
  } catch (error) {
    console.error('Error fetching chats:', error)
    return []
  }
}

// 3. Get Chat Messages
export const getChatMessages = async (chatId: string, page = 1, limit = 50): Promise<Message[]> => {
  try {
    const response = await axios.get<ApiResponse<{ messages: Message[] }>>(
      `${API_BASE_URL}/chat/${chatId}/messages`,
      {
        headers: getAuthHeaders(),
        params: { page, limit }
      }
    )
    return response.data.data.messages || []
  } catch (error) {
    console.error('Error fetching messages:', error)
    return []
  }
}

// 4. Send Message
export const sendMessage = async (chatId: string, content: string, messageType: 'text' | 'image' | 'file' = 'text'): Promise<Message> => {
  try {
    const response = await axios.post<ApiResponse<Message>>(
      `${API_BASE_URL}/chat/${chatId}/send`,
      { 
        message: content.trim(),
        messageType
      },
      { headers: getAuthHeaders() }
    )
    return response.data.data
  } catch (error) {
    console.error('Error sending message:', error)
    throw error
  }
}

// 5. Delete Chat
export const deleteChat = async (chatId: string): Promise<void> => {
  try {
    await axios.delete(
      `${API_BASE_URL}/chat/${chatId}`,
      { headers: getAuthHeaders() }
    )
  } catch (error) {
    console.error('Error deleting chat:', error)
    throw error
  }
}
