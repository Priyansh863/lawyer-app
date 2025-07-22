"use client"

import { useState, useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { X, Send, Loader2, Users, Wifi, WifiOff, MoreVertical, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChatMessage } from "@/components/chat/chat-message"
import { ChatSummary } from "@/components/chat/chat-summary"
import { useChat } from "@/hooks/use-chat"
import { useToast } from "@/hooks/use-toast"
import type { ChatSummary as ChatSummaryType } from "@/types/chat"

const messageFormSchema = z.object({
  content: z.string().min(1, "Message cannot be empty").max(1000, "Message too long"),
})

type MessageFormData = z.infer<typeof messageFormSchema>

interface ChatPopupProps {
  onClose: () => void
  chatId: string
  participantName?: string
  participantAvatar?: string
}

export function ChatPopup({ onClose, chatId, participantName = "User", participantAvatar }: any) {
  const [activeTab, setActiveTab] = useState<string>("chat")
  const [isTyping, setIsTyping] = useState(false)
  const [chatSummary, setChatSummary] = useState<{ summary: string; keyPoints: string[]; tokenUsage: number } | null>(null)
  const [isLoadingSummary, setIsLoadingSummary] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>(null)
  const { toast } = useToast()

  // Initialize chat hook with specific chatId
  const {
    messages,
    currentChat,
    isLoadingMessages,
    isSending,
    isConnected,
    onlineUsers,
    typingUsers,
    sendMessage: sendChatMessage,
    markAsRead,
    deleteChat: deleteChatHandler,
    getChatSummary: getChatSummaryHandler,
    startTyping,
    stopTyping,
    isUserOnline,
    isUserTyping: isUserTypingInChat,
    setCurrentChat,
    error
  } = useChat({ chatId, enableRealTime: true })

  // Message form
  const messageForm = useForm<MessageFormData>({
    resolver: zodResolver(messageFormSchema),
    defaultValues: {
      content: "",
    },
  })

  // Set current chat on mount
  useEffect(() => {
    const chatSummary: ChatSummaryType = {
      chatId,
      participantName,
      participantAvatar,
      lastMessageTime: new Date().toISOString(),
      lastMessagePreview: '',
      unreadCount: 0,
      isOnline: false
    }
    setCurrentChat(chatSummary)
  }, [chatId, participantName, participantAvatar, setCurrentChat])

  // Auto-scroll when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
      }, 100)
    }
  }, [messages])

  // Handle typing indicators
  const handleInputChange = (value: string) => {
    if (value.trim() && !isTyping) {
      setIsTyping(true)
      startTyping()
    } else if (!value.trim() && isTyping) {
      setIsTyping(false)
      stopTyping()
    }

    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set new timeout to stop typing
    if (value.trim()) {
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false)
        stopTyping()
      }, 2000)
    }
  }

  // Handle sending message
  const handleSendMessage = async (data: MessageFormData) => {
    if (!data.content.trim()) return

    try {
      await sendChatMessage(data.content.trim())
      messageForm.reset()
      setIsTyping(false)
      stopTyping()
      
      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      
      // Focus back to input
      inputRef.current?.focus()
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  // Handle getting chat summary
  const handleGetSummary = async () => {
    if (!chatId) return
    
    setIsLoadingSummary(true)
    try {
      const summary = await getChatSummaryHandler(chatId)
      setChatSummary(summary)
    } catch (error) {
      console.error('Failed to get chat summary:', error)
    } finally {
      setIsLoadingSummary(false)
    }
  }

  // Handle deleting chat
  const handleDeleteChat = async () => {
    if (!chatId) return
    
    try {
      await deleteChatHandler(chatId)
      onClose()
    } catch (error) {
      console.error('Failed to delete chat:', error)
    }
  }

  // Calculate total tokens used in session
  const totalTokens = messages.reduce((sum, msg) => sum + (msg.tokenCount || 0), 0)
  const maxTokens = 1000 // Maximum tokens per session
  const tokenUsagePercentage = (totalTokens / maxTokens) * 100

  // Check if any user is typing in this chat
  const otherUsersTyping = typingUsers.filter(user => 
    user.chatId === chatId && user.isTyping
  )

  // Check if participant is online
  const participantId = currentChat?.participantName // You might need to get actual participant ID
  const isParticipantOnline = participantId ? isUserOnline(participantId) : false

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      stopTyping()
    }
  }, [stopTyping])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-2xl h-[600px] bg-white rounded-lg shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={participantAvatar || `/placeholder.svg?height=40&width=40`} />
              <AvatarFallback>
                {participantName.split(' ').map((n: any[]) => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold">{participantName}</h3>
                {isConnected ? (
                  <div className="flex items-center space-x-1">
                    <Wifi className="h-3 w-3 text-green-500" />
                    <span className="text-xs text-green-500">Connected</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1">
                    <WifiOff className="h-3 w-3 text-red-500" />
                    <span className="text-xs text-red-500">Disconnected</span>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={isParticipantOnline ? "default" : "secondary"}>
                  {isParticipantOnline ? "Online" : "Offline"}
                </Badge>
                {otherUsersTyping.length > 0 && (
                  <span className="text-xs text-blue-500 animate-pulse">Typing...</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={handleDeleteChat}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Chat
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Token Usage Progress */}
        <div className="px-4 py-2 border-b bg-gray-50">
          <div className="flex items-center justify-between text-sm">
            <span>Token Usage</span>
            <span className={`font-medium ${
              tokenUsagePercentage > 80 ? 'text-red-600' : 
              tokenUsagePercentage > 60 ? 'text-yellow-600' : 'text-green-600'
            }`}>
              {totalTokens} / {maxTokens}
            </span>
          </div>
          <Progress 
            value={tokenUsagePercentage} 
            className={`mt-1 h-2 ${
              tokenUsagePercentage > 80 ? '[&>div]:bg-red-500' : 
              tokenUsagePercentage > 60 ? '[&>div]:bg-yellow-500' : '[&>div]:bg-green-500'
            }`}
          />
        </div>

        {/* Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chat">
              <Users className="h-4 w-4 mr-2" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="summary">
              Summary
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="flex-1 flex flex-col p-0">
            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {isLoadingMessages ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-gray-500">
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  messages.map((message) => (
                    <ChatMessage
                      key={message._id}
                      message={message}
                      isOutgoing={message.senderId === "ai_assistant"}
                    />
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="border-t p-4">
              {error && (
                <div className="mb-2 text-sm text-red-600">
                  Error: {error}
                </div>
              )}
              
              <Form {...messageForm}>
                <form onSubmit={messageForm.handleSubmit(handleSendMessage)} className="flex space-x-2">
                  <FormField
                    control={messageForm.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            // ref={inputRef}
                            placeholder="Type your message..."
                            {...field}
                            onChange={(e) => {
                              field.onChange(e)
                              handleInputChange(e.target.value)
                            }}
                            disabled={isSending || tokenUsagePercentage >= 100}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    size="sm"
                    disabled={!messageForm.watch("content")?.trim() || isSending || tokenUsagePercentage >= 100}
                  >
                    {isSending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </form>
              </Form>
              
              {tokenUsagePercentage > 80 && tokenUsagePercentage < 100 && (
                <div className="mt-2 text-sm text-yellow-600">
                  ⚠️ Approaching token limit. Consider ending the session soon.
                </div>
              )}
              
              {tokenUsagePercentage >= 100 && (
                <div className="mt-2 text-sm text-red-600">
                  🚫 Token limit reached. Delete chat to continue.
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
