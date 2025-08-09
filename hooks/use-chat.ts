import { useState, useEffect, useCallback, useRef } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '@/lib/store'
import { useSocket } from './use-socket'
import { useToast } from './use-toast'
import type { Message, Chat, ChatSummary } from '@/types/chat'
import {
  getChats,
  getChatMessages,
  sendMessage as sendMessageAPI,
  markMessagesAsRead,
  deleteChat,
  getChatSummary,
  transformChatToSummary
} from '@/lib/api/chat-api'

interface UseChatProps {
  chatId?: string
  autoConnect?: boolean
  enableRealTime?: boolean
}

interface UseChatReturn {
  // State
  messages: Message[]
  chats: ChatSummary[]
  currentChat: ChatSummary | null
  isLoading: boolean
  isLoadingMessages: boolean
  isLoadingChats: boolean
  isSending: boolean
  error: string | null
  
  // Socket state
  isConnected: boolean
  onlineUsers: { userId: string; isOnline: boolean }[]
  typingUsers: { userId: string; chatId: string; isTyping: boolean }[]
  
  // Methods
  loadChats: (page?: number, limit?: number) => Promise<void>
  loadMessages: (chatId: string, page?: number, limit?: number) => Promise<void>
  loadMoreMessages: (page: number) => Promise<void>
  sendMessage: (content: string, messageType?: string) => Promise<void>
  markAsRead: (chatId: string) => Promise<void>
  deleteChat: (chatId: string) => Promise<void>
  getChatSummary: (chatId: string) => Promise<{ summary: string; keyPoints: string[]; tokenUsage: number } | null>
  
  // Real-time methods
  joinChat: (chatId: string) => void
  leaveChat: (chatId: string) => void
  startTyping: () => void
  stopTyping: () => void
  
  // Utility methods
  isUserOnline: (userId: string) => boolean
  isUserTyping: (userId: string, chatId: string) => boolean
  refreshChats: () => Promise<void>
  setCurrentChat: (chat: ChatSummary | null) => void
}

export const useChat = ({ 
  chatId, 
  autoConnect = true, 
  enableRealTime = true 
}: UseChatProps = {}): UseChatReturn => {
  // State
  const [messages, setMessages] = useState<Message[]>([])
  const [chats, setChats] = useState<ChatSummary[]>([])
  const [currentChat, setCurrentChatState] = useState<ChatSummary | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [isLoadingChats, setIsLoadingChats] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMoreMessages, setHasMoreMessages] = useState(true)
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>(null)
  
  // Hooks
  const { toast } = useToast()
  const profile = useSelector((state: RootState) => state.auth.user)
  const {
    socket,
    isConnected,
    onlineUsers,
    typingUsers,
    joinChat: socketJoinChat,
    leaveChat: socketLeaveChat,
    sendMessage: socketSendMessage,
    markAsRead: socketMarkAsRead,
    startTyping: socketStartTyping,
    stopTyping: socketStopTyping,
    isUserOnline,
    isUserTyping,
    onNewMessage,
    onUserTyping,
    onMessageRead,
    onUserStatus,
    onError
  } = useSocket({ autoConnect: enableRealTime && autoConnect })
  
  // Helper function to scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])
  
  // Load chats
  const loadChats = useCallback(async (page = 1, limit = 20) => {
    if (!profile?._id) return
    
    setIsLoadingChats(true)
    setError(null)
    
    try {
      const response = await getChats({ page, limit })
      const chatSummaries = response.data.chats.map((chat: any) => 
        transformChatToSummary(chat, profile._id as string)
      )
      
      if (page === 1) {
        setChats(chatSummaries)
      } else {
        setChats(prev => [...prev, ...chatSummaries])
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load chats'
      setError(errorMessage)
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
    } finally {
      setIsLoadingChats(false)
    }
  }, [profile?._id, toast])
  
  // Load messages for a specific chat
  const loadMessages = useCallback(async (targetChatId: string, page = 1, limit = 50) => {
    if (!targetChatId) return
    
    setIsLoadingMessages(true)
    setError(null)
    
    try {
      const response = await getChatMessages(targetChatId, page, limit)
      const newMessages = response.data.messages.reverse() // Reverse to show oldest first
      
      if (page === 1) {
        setMessages(newMessages)
        setCurrentPage(1)
        setHasMoreMessages(response.data.pagination.currentPage < response.data.pagination.totalPages)
      } else {
        setMessages(prev => [...newMessages, ...prev])
        setHasMoreMessages(response.data.pagination.currentPage < response.data.pagination.totalPages)
      }
      
      // Scroll to bottom for initial load
      if (page === 1) {
        setTimeout(scrollToBottom, 100)
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load messages'
      setError(errorMessage)
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
    } finally {
      setIsLoadingMessages(false)
    }
  }, [toast, scrollToBottom])
  
  // Load more messages (pagination)
  const loadMoreMessages = useCallback(async (page: number) => {
    if (!currentChat?.chatId || !hasMoreMessages) return
    
    await loadMessages(currentChat.chatId, page, 50)
    setCurrentPage(page)
  }, [currentChat?.chatId, hasMoreMessages, loadMessages])
  
  // Send message (hybrid approach: Socket.IO primary, REST fallback)
  const sendMessage = useCallback(async (content: string, messageType = 'text') => {
    if (!currentChat?.chatId || !content.trim()) return
    
    setIsSending(true)
    setError(null)
    
    try {
      if (enableRealTime && isConnected && socket) {
        // Primary: Send via Socket.IO
        socketSendMessage({
          chatId: currentChat.chatId,
          message: content.trim(),
          messageType
        })
        
        // Optimistic update - add message immediately to UI
        const optimisticMessage: Message = {
          _id: `temp-${Date.now()}`,
          chatId: currentChat.chatId,
          senderId: profile?._id || 'unknown',
          content: content.trim(),
          messageType: messageType as 'text' | 'image' | 'file',
          isRead: false,
          readBy: [],
          createdAt: new Date().toISOString(),
          tokenCount: Math.ceil(content.length / 4) // Rough estimate
        }
        
        setMessages(prev => [...prev, optimisticMessage])
        setTimeout(scrollToBottom, 100)
      } else {
        // Fallback: Send via REST API
        const newMessage = await sendMessageAPI({
          chatId: currentChat.chatId,
          message: content.trim(),
          messageType: messageType as 'text' | 'image' | 'file'
        })
        
        setMessages(prev => [...prev, newMessage])
        setTimeout(scrollToBottom, 100)
      }
      
      // Update chat list to reflect new message
      setChats(prev => prev.map(chat => 
        chat.chatId === currentChat.chatId
          ? { ...chat, lastMessagePreview: content.trim(), lastMessageTime: new Date().toISOString() }
          : chat
      ))
      
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to send message'
      setError(errorMessage)
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
    } finally {
      setIsSending(false)
    }
  }, [currentChat?.chatId, enableRealTime, isConnected, socket, socketSendMessage, profile?._id, toast, scrollToBottom])
  
  // Mark messages as read
  const markAsRead = useCallback(async (targetChatId: string) => {
    if (!targetChatId) return
    
    try {
      if (enableRealTime && isConnected && socket) {
        socketMarkAsRead({ chatId: targetChatId })
      } else {
        await markMessagesAsRead(targetChatId)
      }
      
      // Update local state
      setMessages(prev => prev.map(msg => 
        msg.chatId === targetChatId ? { ...msg, isRead: true } : msg
      ))
      
      setChats(prev => prev.map(chat =>
        chat.chatId === targetChatId ? { ...chat, unreadCount: 0 } : chat
      ))
    } catch (err: any) {
      console.error('Failed to mark messages as read:', err)
    }
  }, [enableRealTime, isConnected, socket, socketMarkAsRead])
  
  // Delete chat
  const deleteChatHandler = useCallback(async (targetChatId: string) => {
    try {
      await deleteChat(targetChatId)
      setChats(prev => prev.filter(chat => chat.chatId !== targetChatId))
      
      if (currentChat?.chatId === targetChatId) {
        setCurrentChatState(null)
        setMessages([])
      }
      
      toast({
        title: 'Success',
        description: 'Chat deleted successfully',
        variant: 'default'
      })
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete chat'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
    }
  }, [currentChat?.chatId, toast])
  
  // Get chat summary
  const getChatSummaryHandler = useCallback(async (targetChatId: string) => {
    try {
      return await getChatSummary(targetChatId)
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to get chat summary'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
      return null
    }
  }, [toast])
  
  // Real-time methods
  const joinChat = useCallback((targetChatId: string) => {
    if (enableRealTime) {
      socketJoinChat(targetChatId)
    }
  }, [enableRealTime, socketJoinChat])
  
  const leaveChat = useCallback((targetChatId: string) => {
    if (enableRealTime) {
      socketLeaveChat(targetChatId)
    }
  }, [enableRealTime, socketLeaveChat])
  
  const startTyping = useCallback(() => {
    if (enableRealTime && currentChat?.chatId) {
      socketStartTyping({ chatId: currentChat.chatId })
      
      // Auto-stop typing after 3 seconds
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        socketStopTyping({ chatId: currentChat.chatId })
      }, 3000)
    }
  }, [enableRealTime, currentChat?.chatId, socketStartTyping, socketStopTyping])
  
  const stopTyping = useCallback(() => {
    if (enableRealTime && currentChat?.chatId) {
      socketStopTyping({ chatId: currentChat.chatId })
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [enableRealTime, currentChat?.chatId, socketStopTyping])
  
  // Set current chat
  const setCurrentChat = useCallback((chat: ChatSummary | null) => {
    // Leave previous chat room
    if (currentChat?.chatId) {
      leaveChat(currentChat.chatId)
    }
    
    setCurrentChatState(chat)
    setMessages([])
    setCurrentPage(1)
    setHasMoreMessages(true)
    
    // Join new chat room and load messages
    if (chat?.chatId) {
      joinChat(chat.chatId)
      loadMessages(chat.chatId)
      markAsRead(chat.chatId)
    }
  }, [currentChat?.chatId, leaveChat, joinChat, loadMessages, markAsRead])
  
  // Refresh chats
  const refreshChats = useCallback(async () => {
    await loadChats(1, 20)
  }, [loadChats])
  
  // Setup real-time event listeners
  useEffect(() => {
    if (!enableRealTime) return
    
    onNewMessage((data) => {
      // Add new message to current chat
      if (data.chatId === currentChat?.chatId) {
        setMessages(prev => {
          // Remove any temporary/optimistic messages with same content
          const filtered = prev.filter(msg => 
            !msg._id.startsWith('temp-') || msg.content !== data.message.content
          )
          return [...filtered, data.message]
        })
        setTimeout(scrollToBottom, 100)
      }
      
      // Update chat list
      setChats(prev => prev.map(chat =>
        chat.chatId === data.chatId
          ? { 
              ...chat, 
              lastMessagePreview: data.message.content,
              lastMessageTime: data.message.createdAt,
              unreadCount: chat.chatId === currentChat?.chatId ? 0 : (chat.unreadCount || 0) + 1
            }
          : chat
      ))
    })
    
    onMessageRead((data) => {
      if (data.chatId === currentChat?.chatId) {
        setMessages(prev => prev.map(msg =>
          data.messageIds.includes(msg._id) ? { ...msg, isRead: true } : msg
        ))
      }
    })
    
    onError((error) => {
      setError(error.message)
    })
  }, [enableRealTime, currentChat?.chatId, onNewMessage, onMessageRead, onError, scrollToBottom])
  
  // Initial load
  useEffect(() => {
    if (profile?._id) {
      loadChats()
    }
  }, [profile?._id, loadChats])
  
  // Handle specific chat ID
  useEffect(() => {
    if (chatId && chats.length > 0) {
      const chat = chats.find(c => c.chatId === chatId)
      if (chat) {
        setCurrentChat(chat)
      }
    }
  }, [chatId, chats, setCurrentChat])
  
  // Cleanup
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])
  
  return {
    // State
    messages,
    chats,
    currentChat,
    isLoading,
    isLoadingMessages,
    isLoadingChats,
    isSending,
    error,
    
    // Socket state
    isConnected,
    onlineUsers,
    typingUsers,
    
    // Methods
    loadChats,
    loadMessages,
    loadMoreMessages,
    sendMessage,
    markAsRead,
    deleteChat: deleteChatHandler,
    getChatSummary: getChatSummaryHandler,
    
    // Real-time methods
    joinChat,
    leaveChat,
    startTyping,
    stopTyping,
    
    // Utility methods
    isUserOnline,
    isUserTyping,
    refreshChats,
    setCurrentChat
  }
}

export default useChat
