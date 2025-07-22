import { useEffect, useState, useCallback, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { useSelector } from 'react-redux'
import { RootState } from '@/lib/store'
import type { Message, TypingUser, OnlineUser } from '@/types/chat'
import { useToast } from '@/hooks/use-toast'

interface UseSocketProps {
  autoConnect?: boolean
}

interface UseSocketReturn {
  socket: Socket | null
  isConnected: boolean
  onlineUsers: OnlineUser[]
  typingUsers: TypingUser[]
  
  // Connection methods
  connect: () => void
  disconnect: () => void
  
  // Chat methods
  joinChat: (chatId: string) => void
  leaveChat: (chatId: string) => void
  sendMessage: (data: { chatId: string; message: string; messageType?: string }) => void
  markAsRead: (data: { chatId: string }) => void
  
  // Typing methods
  startTyping: (data: { chatId: string }) => void
  stopTyping: (data: { chatId: string }) => void
  
  // Utility methods
  isUserOnline: (userId: string) => boolean
  isUserTyping: (userId: string, chatId: string) => boolean
  
  // Event listeners (to be used in components)
  onNewMessage: (callback: (data: { message: Message; chatId: string; sender: any }) => void) => void
  onUserTyping: (callback: (data: { userId: string; chatId: string; isTyping: boolean }) => void) => void
  onMessageRead: (callback: (data: { chatId: string; userId: string; messageIds: string[] }) => void) => void
  onUserStatus: (callback: (data: { userId: string; isOnline: boolean }) => void) => void
  onError: (callback: (error: { message: string }) => void) => void
}

export const useSocket = ({ autoConnect = true }: UseSocketProps = {}): UseSocketReturn => {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([])
  
  const { toast } = useToast()
  const profile = useSelector((state: RootState) => state.auth.user)
  const eventListenersRef = useRef<Map<string, Function>>(new Map())
  
  const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'
  
  // Initialize socket connection


  const getToken = () => {
    if (typeof window !== "undefined") {
      const user = localStorage.getItem("user");
      return user ? JSON.parse(user).token : null;
    }
    return null;
  };
  
  const connect = useCallback(() => {
    if (socket?.connected) return
    
    if (!getToken()) {
      console.error('No auth token available for socket connection')
      return
    }
    
    const newSocket = io(SOCKET_URL, {
      auth: {
        token: getToken()
      },
      transports: ['websocket', 'polling']
    })
    
    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id)
      setIsConnected(true)
    })
    
    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason)
      setIsConnected(false)
    })
    
    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
      toast({
        title: 'Connection Error',
        description: 'Failed to connect to chat server',
        variant: 'destructive'
      })
    })
    
    // Chat event handlers
    newSocket.on('new_message', (data) => {
      const callback = eventListenersRef.current.get('new_message')
      if (callback) callback(data)
    })
    
    newSocket.on('user_typing', (data) => {
      // Update typing users state
      setTypingUsers(prev => {
        const filtered = prev.filter(u => !(u.userId === data.userId && u.chatId === data.chatId))
        if (data.isTyping) {
          return [...filtered, { userId: data.userId, chatId: data.chatId, isTyping: true }]
        }
        return filtered
      })
      
      const callback = eventListenersRef.current.get('user_typing')
      if (callback) callback(data)
    })
    
    newSocket.on('message_read', (data) => {
      const callback = eventListenersRef.current.get('message_read')
      if (callback) callback(data)
    })
    
    newSocket.on('user_status', (data) => {
      // Update online users state
      setOnlineUsers(prev => {
        const filtered = prev.filter(u => u.userId !== data.userId)
        return [...filtered, { userId: data.userId, isOnline: data.isOnline }]
      })
      
      const callback = eventListenersRef.current.get('user_status')
      if (callback) callback(data)
    })
    
    newSocket.on('error', (error) => {
      console.error('Socket error:', error)
      const callback = eventListenersRef.current.get('error')
      if (callback) callback(error)
      
      toast({
        title: 'Chat Error',
        description: error.message || 'An error occurred in chat',
        variant: 'destructive'
      })
    })
    
    setSocket(newSocket)
  }, [SOCKET_URL, toast])
  
  // Disconnect socket
  const disconnect = useCallback(() => {
    if (socket) {
      socket.disconnect()
      setSocket(null)
      setIsConnected(false)
      setOnlineUsers([])
      setTypingUsers([])
    }
  }, [socket])
  
  // Chat methods
  const joinChat = useCallback((chatId: string) => {
    if (socket && isConnected) {
      socket.emit('join_chat', chatId)
    }
  }, [socket, isConnected])
  
  const leaveChat = useCallback((chatId: string) => {
    if (socket && isConnected) {
      socket.emit('leave_chat', chatId)
    }
  }, [socket, isConnected])
  
  const sendMessage = useCallback((data: { chatId: string; message: string; messageType?: string }) => {
    if (socket && isConnected) {
      socket.emit('send_message', data)
    }
  }, [socket, isConnected])
  
  const markAsRead = useCallback((data: { chatId: string }) => {
    if (socket && isConnected) {
      socket.emit('mark_as_read', data)
    }
  }, [socket, isConnected])
  
  // Typing methods
  const startTyping = useCallback((data: { chatId: string }) => {
    if (socket && isConnected) {
      socket.emit('start_typing', data)
    }
  }, [socket, isConnected])
  
  const stopTyping = useCallback((data: { chatId: string }) => {
    if (socket && isConnected) {
      socket.emit('stop_typing', data)
    }
  }, [socket, isConnected])
  
  // Utility methods
  const isUserOnline = useCallback((userId: string) => {
    return onlineUsers.some(user => user.userId === userId && user.isOnline)
  }, [onlineUsers])
  
  const isUserTyping = useCallback((userId: string, chatId: string) => {
    return typingUsers.some(user => 
      user.userId === userId && 
      user.chatId === chatId && 
      user.isTyping
    )
  }, [typingUsers])
  
  // Event listener registration methods
  const onNewMessage = useCallback((callback: (data: { message: Message; chatId: string; sender: any }) => void) => {
    eventListenersRef.current.set('new_message', callback)
  }, [])
  
  const onUserTyping = useCallback((callback: (data: { userId: string; chatId: string; isTyping: boolean }) => void) => {
    eventListenersRef.current.set('user_typing', callback)
  }, [])
  
  const onMessageRead = useCallback((callback: (data: { chatId: string; userId: string; messageIds: string[] }) => void) => {
    eventListenersRef.current.set('message_read', callback)
  }, [])
  
  const onUserStatus = useCallback((callback: (data: { userId: string; isOnline: boolean }) => void) => {
    eventListenersRef.current.set('user_status', callback)
  }, [])
  
  const onError = useCallback((callback: (error: { message: string }) => void) => {
    eventListenersRef.current.set('error', callback)
  }, [])
  
  // Auto-connect on mount if enabled and user is authenticated
  useEffect(() => {
    if (autoConnect && getToken() && !socket) {
      connect()
    }
    
    return () => {
      if (socket) {
        disconnect()
      }
    }
  }, [autoConnect, getToken(), connect, disconnect, socket])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      eventListenersRef.current.clear()
    }
  }, [])
  
  return {
    socket,
    isConnected,
    onlineUsers,
    typingUsers,
    
    // Connection methods
    connect,
    disconnect,
    
    // Chat methods
    joinChat,
    leaveChat,
    sendMessage,
    markAsRead,
    
    // Typing methods
    startTyping,
    stopTyping,
    
    // Utility methods
    isUserOnline,
    isUserTyping,
    
    // Event listeners
    onNewMessage,
    onUserTyping,
    onMessageRead,
    onUserStatus,
    onError
  }
}

export default useSocket
