"use client"

import { useState, useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { X, Send, Loader2, MessageSquare, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { useSelector } from "react-redux"
import type { RootState } from "@/lib/store"
import { useTranslation } from "@/hooks/useTranslation"

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
  chatId?: string
}

export function SimpleChat({
  onClose,
  clientId,
  clientName = "User",
  clientAvatar,
  chatId: initialChatId,
}: SimpleChatProps) {
  const { t } = useTranslation()
  const [chat, setChat] = useState<Chat | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const profile = useSelector((state: RootState) => state.auth.user)
const currentUserId = profile?._id

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // 🔹 Drag state
  const [position, setPosition] = useState({ x: window.innerWidth - 380, y: window.innerHeight - 520 })
  const dragOffset = useRef({ x: 0, y: 0 })
  const isDragging = useRef(false)

  const messageForm = useForm<MessageFormData>({
    resolver: zodResolver(messageFormSchema),
    defaultValues: {
      content: "",
    },
  })

  useEffect(() => {
    const initializeChat = async () => {
      if (!clientId && !initialChatId) return
      setIsInitializing(true)
      try {
        let chatData: Chat
        if (initialChatId) {
          chatData = {
            _id: initialChatId,
            lawyer_id: {
              _id: "current_user",
              first_name: t("pages:conv.lawyer"),
              last_name: t("pages:conv.user"),
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
          chatData = await createOrGetChat(clientId)
        } else {
          return
        }
        setChat(chatData)
        const chatMessages = await getChatMessages(chatData._id)
        setMessages(chatMessages)
      } catch (error) {
        toast({
            title: t("pages:conv.error"),
          description: t("pages:conv.failedToLoadChat"),
          variant: "destructive",
        })
      } finally {
        setIsInitializing(false)
      }
    }
    initializeChat()
  }, [clientId, initialChatId, clientName, clientAvatar, toast])

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
      }, 100)
    }
  }, [messages])

  const handleSendMessage = async (data: MessageFormData) => {
    if (!chat || !data.content.trim()) return
    setIsSending(true)
    try {
      const newMessage = await sendChatMessage(chat._id, data.content.trim())
      setMessages((prev) => [...prev, newMessage])
      messageForm.reset()
    } catch (error) {
      toast({
        title: t("pages:conv.error"),
        description: t("pages:conv.failedToSendMessage"),
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleDeleteChat = async () => {
    if (!chat) return
    try {
      await deleteChat(chat._id)
      toast({
        title: t("pages:conv.chatDeleted"),
        description: t("pages:conv.chatDeletedSuccessfully"),
      })
      onClose()
    } catch {
      toast({
        title: t("pages:conv.error"),
description: t("pages:conv.failedToDeleteChat"),
        variant: "destructive",
      })
    }
  }

  // 🔹 Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("input, textarea, button")) return // Don't drag when clicking input/buttons
    isDragging.current = true
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    }
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.current) return
    setPosition({
      x: e.clientX - dragOffset.current.x,
      y: e.clientY - dragOffset.current.y,
    })
  }

  const handleMouseUp = () => {
    isDragging.current = false
  }

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [])

  const participant = chat?.lawyer_id?._id === currentUserId ? chat?.client_id : chat?.lawyer_id
  const participantName = participant ? `${participant.first_name} ${participant.last_name}`.trim() : clientName

  if (isInitializing) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <div className="w-[360px] h-[500px] bg-white rounded-lg shadow-xl flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div
      className="z-50"
      style={{
        position: "fixed",
        top: position.y,
        left: position.x,
        width: 360,
        height: 500,
      }}
    >
      <div
        className="bg-white rounded-lg shadow-xl flex flex-col w-full h-full"
        onMouseDown={handleMouseDown} // Drag starts here
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b cursor-move">
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
              <p className="text-sm text-gray-500">{participant?.email || t("pages:conv.client")}</p>
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
                <MessageSquare className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>{t("pages:conv.noMessagesYet")}</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message._id}
                  className={`flex ${message.senderId._id === currentUserId ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 ${
                      message.senderId._id === currentUserId
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    <p className="text-sm break-words">{message.content}</p>
                    <span className="text-xs opacity-70">
                      {new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="border-t p-4 bg-white">
          <Form {...messageForm}>
            <form onSubmit={messageForm.handleSubmit(handleSendMessage)} className="flex space-x-2">
              <FormField
                control={messageForm.control}
                name="content"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input placeholder={t("pages:conv.typeYourMessage")} {...field} disabled={isSending} />
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
