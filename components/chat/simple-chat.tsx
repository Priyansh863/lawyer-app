"use client"

import { useState, useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { X, Send, Loader2, MessageSquare, Trash2 } from "lucide-react" // Added Send back

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input" // Added Input
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form" // Added Form components
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"

import {
  createOrGetChat,
  getChatMessages,
  sendMessage as sendChatMessage,
  deleteChat,
  type Message,
  type Chat,
} from "@/lib/api/simple-chat-api"

const messageFormSchema = z.object({
  content: z.string().min(1, "Message cannot be empty").max(1000, "Message too long"),
})

type MessageFormData = z.infer<typeof messageFormSchema>

interface SimpleChatProps {
  onClose: () => void
  clientId?: string
  clientName?: string
  clientAvatar?: string
  chatId?: string // If we already have a chatId
}

export function SimpleChat({
  onClose,
  clientId,
  clientName = "User",
  clientAvatar,
  chatId: initialChatId,
}: SimpleChatProps) {
  const [chat, setChat] = useState<Chat | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Message form
  const messageForm = useForm<MessageFormData>({
    resolver: zodResolver(messageFormSchema),
    defaultValues: {
      content: "",
    },
  })

  // Initialize chat (either create new or use existing)
  useEffect(() => {
    const initializeChat = async () => {
      if (!clientId && !initialChatId) return

      setIsInitializing(true)
      try {
        let chatData: Chat

        if (initialChatId) {
          // If we have chatId, we need to get chat details
          // For now, we'll create a minimal chat object
          chatData = {
            _id: initialChatId,
            lawyer_id: {
              _id: "current_user",
              first_name: "Lawyer",
              last_name: "User",
              email: "lawyer@example.com",
            },
            client_id: {
              _id: clientId || "unknown",
              first_name: clientName.split(" ")[0] || "User",
              last_name: clientName.split(" ")[1] || "",
              email: "",
              avatar: clientAvatar,
            },
            unreadCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        } else if (clientId) {
          // Create or get existing chat with client
          chatData = await createOrGetChat(clientId)
        } else {
          return
        }

        setChat(chatData)

        // Load messages
        const chatMessages = await getChatMessages(chatData._id)
        setMessages(chatMessages)
      } catch (error) {
        console.error("Error initializing chat:", error)
        toast({
          title: "Error",
          description: "Failed to load chat",
          variant: "destructive",
        })
      } finally {
        setIsInitializing(false)
      }
    }
    initializeChat()
  }, [clientId, initialChatId, clientName, clientAvatar, toast]) // All dependencies declared [^2]

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
      }, 100)
    }
  }, [messages])

  // Handle sending message
  const handleSendMessage = async (data: MessageFormData) => {
    if (!chat || !data.content.trim()) return

    setIsSending(true)
    try {
      const newMessage = await sendChatMessage(chat._id, data.content.trim())
      setMessages((prev) => [...prev, newMessage])
      messageForm.reset()

      toast({
        title: "Message sent",
        description: "Your message has been delivered",
      })
    } catch (error) {
      console.error("Failed to send message:", error)
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  // Handle deleting chat
  const handleDeleteChat = async () => {
    if (!chat) return

    try {
      await deleteChat(chat._id)
      toast({
        title: "Chat deleted",
        description: "The chat has been deleted successfully",
      })
      onClose()
    } catch (error) {
      console.error("Failed to delete chat:", error)
      toast({
        title: "Error",
        description: "Failed to delete chat",
        variant: "destructive",
      })
    }
  }

  // Get participant info (determine if current user is lawyer or client)
  const currentUserId = "current_user" // This should come from Redux/auth state
  const participant = chat?.lawyer_id?._id === currentUserId ? chat?.client_id : chat?.lawyer_id
  const participantName = participant ? `${participant.first_name} ${participant.last_name}`.trim() : clientName

  if (isInitializing) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <div className="w-[360px] h-[500px] bg-white rounded-lg shadow-xl flex flex-col items-center justify-center">
          <div className="flex items-center space-x-3">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading chat...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="w-[360px] h-[500px] bg-white rounded-lg shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage
                src={
                  participant?.avatar ||
                  clientAvatar ||
                  `/placeholder.svg?height=40&width=40&query=${encodeURIComponent(participantName)}`
                }
              />
              <AvatarFallback>
                {participantName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">{participantName}</h3>
              <p className="text-sm text-gray-500">{participant?.email || "Client"}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={handleDeleteChat}>
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-2">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-gray-500">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>No messages yet. Start the conversation!</p>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message._id}
                  className={`flex ${message.senderId._id === currentUserId ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 ${
                      message.senderId._id === currentUserId ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    <p className="text-sm break-words">{message.content}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs opacity-70">
                        {new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {message.tokenCount && (
                        <span className="text-xs opacity-70 ml-2">{message.tokenCount} tokens</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="border-t p-4">
          <Form {...messageForm}>
            <form onSubmit={messageForm.handleSubmit(handleSendMessage)} className="flex space-x-2">
              <FormField
                control={messageForm.control}
                name="content"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input placeholder="Type your message..." {...field} disabled={isSending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" size="sm" disabled={!messageForm.watch("content")?.trim() || isSending}>
                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  )
}
