"use client"

import { useState, useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { X, Smile, Paperclip, Send, FileText, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ChatMessage } from "@/components/chat/chat-message"
import { getClientById } from "@/lib/api/clients-api"
import { getMessages, sendMessage, endChatSession } from "@/lib/api/chat-api"
import { useToast } from "@/hooks/use-toast"
import type { Message } from "@/types/chat"
import type { Client } from "@/types/client"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { ChatSummary } from "@/components/chat/chat-summary"

const messageFormSchema = z.object({
  content: z.string().min(1, "Message cannot be empty").max(1000, "Message too long"),
})

type MessageFormData = z.infer<typeof messageFormSchema>

const sessionActionSchema = z.object({
  action: z.enum(["end", "summary"]),
  clientId: z.string(),
})

type SessionActionData = z.infer<typeof sessionActionSchema>

interface ChatPopupProps {
  onClose: () => void
  clientId: string | null
}

export function ChatPopup({ onClose, clientId }: ChatPopupProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [client, setClient] = useState<Client | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEndingSession, setIsEndingSession] = useState(false)
  const [activeTab, setActiveTab] = useState<string>("chat")
  const [tokenCount, setTokenCount] = useState(0)
  const [sessionTokens, setSessionTokens] = useState(0)
  const [maxTokens] = useState(1000) // Maximum tokens per session
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Message form
  const messageForm = useForm<MessageFormData>({
    resolver: zodResolver(messageFormSchema),
    defaultValues: {
      content: "",
    },
  })

  const watchedContent = messageForm.watch("content")

  //Calculate tokens for the current message approximately 4 chars = 1 token
  useEffect(() => {
    setTokenCount(Math.ceil(watchedContent.length / 4))
  }, [watchedContent])

  // Load client and messages
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        if (clientId) {
          const clientData = await getClientById(clientId)
          setClient(clientData)
          const messageData = await getMessages(clientId)
          setMessages(messageData)

          // Calculate total tokens used in this session
          const totalTokens = messageData.reduce((sum, msg) => sum + (msg.tokenCount || 0), 0)
          setSessionTokens(totalTokens)
        } else {
          // If no client ID, load default AI assistant chat
          setClient({
            id: "ai_assistant",
            name: "AI Assistant",
            email: "",
            phone: "",
            address: "",
            status: "active",
            createdAt: "",
            lastContactDate: "",
            caseId: "",
            contactInfo: "",
            activeCases: 0,
            isFavorite: false,
            isBlocked: false,
            avatar: "/placeholder.svg?height=40&width=40",
          })

          // Load AI assistant messages
          const messageData = await getMessages("ai_assistant")
          setMessages(
            messageData.length > 0
              ? messageData
              : [
                  {
                    id: "welcome_msg",
                    content: "Hello! I'm your AI legal assistant. How can I help you today?",
                    senderId: "ai_assistant",
                    receiverId: "current_user",
                    timestamp: new Date().toISOString(),
                    isRead: true,
                    attachments: [],
                    tokenCount: 15,
                  },
                ],
          )

          // Calculate total tokens used in this session
          const totalTokens =
            messageData.length > 0 ? messageData.reduce((sum, msg) => sum + (msg.tokenCount || 0), 0) : 15
          setSessionTokens(totalTokens)
        }
      } catch (error) {
        console.error("Error loading chat data:", error)
        toast({
          title: "Error",
          description: "Failed to load chat data",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [clientId, toast])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const onMessageSubmit = async (data: MessageFormData) => {
    if (!client) return

    // Check if sending this message would exceed the token limit
    if (sessionTokens + tokenCount > maxTokens) {
      toast({
        title: "Token limit reached",
        description: "You've reached the maximum token limit for this session.",
        variant: "destructive",
      })
      return
    }

    try {
      const message: Message = {
        id: `msg_${Date.now()}`,
        content: data.content,
        senderId: "current_user",
        receiverId: client.id,
        timestamp: new Date().toISOString(),
        isRead: false,
        attachments: [],
        tokenCount: tokenCount,
      }

      // Add message to UI immediately
      setMessages((prev) => [...prev, message])
      messageForm.reset()

      // Update session token count
      setSessionTokens((prev) => prev + tokenCount)

      // Send to API
      await sendMessage(message)

      // If this is the AI assistant, simulate a response
      if (client.id === "ai_assistant") {
        setTimeout(async () => {
          const aiResponseTokens = 20 // Approximate tokens for AI response
          const aiResponse: Message = {
            id: `msg_${Date.now() + 1}`,
            content: "I'm processing your request. Let me help you with that.",
            senderId: "ai_assistant",
            receiverId: "current_user",
            timestamp: new Date().toISOString(),
            isRead: true,
            attachments: [],
            tokenCount: aiResponseTokens,
          }
          setMessages((prev) => [...prev, aiResponse])
          setSessionTokens((prev) => prev + aiResponseTokens)
        }, 1000)
      }

      toast({
        title: "Message sent",
        description: "Your message has been sent successfully",
      })
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      })
    }
  }

  const handleSessionAction = async (actionData: SessionActionData) => {
    if (actionData.action === "end") {
      setIsEndingSession(true)
      try {
        await endChatSession(actionData.clientId)
        toast({
          title: "Session ended",
          description: "Chat session has been ended successfully.",
        })
        onClose()
      } catch (error) {
        console.error("Error ending session:", error)
        toast({
          title: "Error",
          description: "Failed to end session",
          variant: "destructive",
        })
      } finally {
        setIsEndingSession(false)
      }
    } else if (actionData.action === "summary") {
      setActiveTab("summary")
    }
  }

  const handleEndSession = () => {
    if (!client) return
    handleSessionAction({ action: "end", clientId: client.id })
  }

  const handleViewSummary = () => {
    if (!client) return
    handleSessionAction({ action: "summary", clientId: client.id })
  }

  return (
    <div className="fixed bottom-20 right-4 w-80 sm:w-96 h-[500px] bg-white rounded-lg shadow-xl flex flex-col overflow-hidden border z-50">
      {/* Header */}
      <div className="p-3 border-b flex items-center justify-between bg-[#0f0921] text-white">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={client?.avatar || "/placeholder.svg?height=32&width=32"} alt={client?.name || "Chat"} />
            <AvatarFallback>{client?.name?.[0] || "A"}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium">{client?.name || "Chat"}</span>
            <div className="flex items-center gap-1">
              <Badge variant="outline" className="text-xs bg-white/10 text-white border-white/20">
                Tokens: {sessionTokens}/{maxTokens}
              </Badge>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/10">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid grid-cols-2 mx-3 mt-2">
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="flex-1 flex flex-col p-0">
          {/* Token usage indicator */}
          <div className="px-3 py-1 border-b">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Session token usage</span>
              <span>
                {sessionTokens}/{maxTokens}
              </span>
            </div>
            <Progress
              value={(sessionTokens / maxTokens) * 100}
              className="h-1"
              indicatorClassName={
                sessionTokens > maxTokens * 0.9
                  ? "bg-red-500"
                  : sessionTokens > maxTokens * 0.7
                    ? "bg-yellow-500"
                    : "bg-green-500"
              }
            />
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
            {isLoading ? (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex justify-center items-center h-full">
                <span className="text-sm text-gray-500">No messages yet</span>
              </div>
            ) : (
              messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  isOutgoing={message.senderId === "current_user"}
                  showTokenCount
                />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t space-y-2">
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>Current message: ~{tokenCount} tokens</span>
              <span>{watchedContent.length} characters</span>
            </div>

            <Form {...messageForm}>
              <form onSubmit={messageForm.handleSubmit(onMessageSubmit)} className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-gray-500 hover:text-gray-700"
                  aria-label="Add attachment"
                >
                  <Paperclip className="h-5 w-5" />
                </Button>
                <FormField
                  control={messageForm.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input
                          placeholder="Enter text"
                          {...field}
                          disabled={messageForm.formState.isSubmitting}
                          className="bg-[#F5F5F5] border-gray-200"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-gray-500 hover:text-gray-700"
                  aria-label="Add emoji"
                >
                  <Smile className="h-5 w-5" />
                </Button>
                <Button
                  type="submit"
                  size="icon"
                  className="bg-[#0f0921] hover:bg-[#0f0921]/90 text-white rounded-full"
                  disabled={!watchedContent.trim() || messageForm.formState.isSubmitting}
                  aria-label="Send message"
                >
                  {messageForm.formState.isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </Form>

            <div className="flex gap-2 mt-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={handleViewSummary}>
                <FileText className="h-4 w-4 mr-2" />
                View Summary
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleEndSession}
                disabled={isEndingSession}
              >
                {isEndingSession ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Ending...
                  </>
                ) : (
                  "End Session"
                )}
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="summary" className="flex-1 p-0">
          <ChatSummary messages={messages} onBack={() => setActiveTab("chat")} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
