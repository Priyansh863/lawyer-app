"use client"

import { useState, useEffect, forwardRef, useImperativeHandle } from "react"
import { Search, MessageSquare, Trash2, Loader2, Download } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { SimpleChat } from "@/components/chat/simple-chat"
import {
  getUserChats,
  deleteChat as deleteChatAPI,
  getChatMessages,
  type Chat
} from "@/lib/api/simple-chat-api"
import { useTranslation } from "@/hooks/useTranslation"
import Skeleton from "react-loading-skeleton"
import "react-loading-skeleton/dist/skeleton.css"

export interface SimpleChatListRef {
  refreshChats: () => void;
}

export interface SimpleChatListProps {
  searchQueryProp?: string;
  onNewChatClick?: () => void;
}

const SimpleChatList = forwardRef<SimpleChatListRef, SimpleChatListProps>(({ searchQueryProp = "", onNewChatClick }, ref) => {
  const { t } = useTranslation()
  const [chats, setChats] = useState<Chat[]>([])
  const [filteredChats, setFilteredChats] = useState<Chat[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
  const [showChat, setShowChat] = useState(false)
  const [chatToDelete, setChatToDelete] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const { toast } = useToast()

  // Expose refresh method to parent components
  useImperativeHandle(ref, () => ({
    refreshChats: loadChats
  }))

  useEffect(() => {
    loadChats()
  }, [])

  useEffect(() => {
    if (!searchQueryProp.trim()) {
      setFilteredChats(chats)
    } else {
      const filtered = chats.filter(chat => {
        const currentUserId = 'current_user' // Should come from Redux/auth
        const participant = chat.lawyer_id._id === currentUserId ? chat.client_id : chat.lawyer_id
        const participantName = `${participant.first_name} ${participant.last_name}`.toLowerCase()
        const lastMessage = chat.lastMessage?.content?.toLowerCase() || ''

        return participantName.includes(searchQueryProp.toLowerCase()) ||
          lastMessage.includes(searchQueryProp.toLowerCase())
      })
      setFilteredChats(filtered)
    }
  }, [chats, searchQueryProp])

  const loadChats = async () => {
    setIsLoading(true)
    try {
      const fetchedChats = await getUserChats()
      setChats(fetchedChats)
    } catch (error) {
      console.error('Error loading chats:', error)
      toast({
        title: t('pages:chatbox.errors.load.title'),
        description: t('pages:chatbox.errors.load.description'),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteClick = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setChatToDelete(chatId)
    setShowDeleteConfirm(true)
  }

  const confirmDeleteChat = async () => {
    if (!chatToDelete) return

    try {
      await deleteChatAPI(chatToDelete)
      setChats(prev => prev.filter(chat => chat._id !== chatToDelete))
      toast({
        title: t('pages:chatbox.delete.success.title'),
        description: t('pages:chatbox.delete.success.description'),
      })
    } catch (error) {
      console.error('Error deleting chat:', error)
      toast({
        title: t('pages:chatbox.errors.delete.title'),
        description: t('pages:chatbox.errors.delete.description'),
        variant: "destructive",
      })
    } finally {
      setShowDeleteConfirm(false)
      setChatToDelete(null)
    }
  }

  const cancelDeleteChat = () => {
    setShowDeleteConfirm(false)
    setChatToDelete(null)
    toast({
      title: t('pages:chatbox.delete.cancelled.title'),
      description: t('pages:chatbox.delete.cancelled.description'),
    })
  }

  const handleChatClick = (chat: Chat) => {
    setSelectedChat(chat)
    setShowChat(true)
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else {
      return date.toLocaleDateString()
    }
  }

  const handleDownloadChat = async (chat: Chat, e: React.MouseEvent) => {
    e.stopPropagation()
    setIsLoading(true)
    try {
      // Fetch all messages for this chat (pass a large limit to get history)
      const messages = await getChatMessages(chat._id, 1, 1000)
      
      const currentUserId = 'current_user' // In real app, get from auth
      const participant = chat.lawyer_id._id === currentUserId ? chat.client_id : chat.lawyer_id
      const participantName = `${participant.first_name} ${participant.last_name}`.trim() || t("pages:conv.user")

      // Build text content
      let textContent = `Chat History with ${participantName}\n`
      textContent += `Exported on: ${new Date().toLocaleString()}\n`
      textContent += `--------------------------------------------------\n\n`

      messages.forEach(msg => {
        // Assuming the API returns sender details populated with at least an ID
        const senderId = typeof msg.senderId === 'object' ? msg.senderId._id : msg.senderId
        const senderName = senderId === currentUserId ? 'Me' : participantName
        const timeString = new Date(msg.createdAt).toLocaleString()
        
        textContent += `[${timeString}] ${senderName}: \n`
        textContent += `${msg.content}\n\n`
      })

      // Trigger download
      const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `chat_history_${participantName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: t('pages:common.success') || 'Success',
        description: 'Chat history downloaded successfully.',
      })
    } catch (error) {
      console.error('Error downloading chat:', error)
      toast({
        title: 'Error',
        description: 'Failed to download chat history. Please try again.',
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {/* Search Bar Skeleton */}
        <div className="relative">
          <Skeleton height={40} />
        </div>

        {/* Chat List Skeleton */}
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <Card key={index} className="cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Skeleton circle width={48} height={48} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <Skeleton width={120} height={20} />
                      <div className="flex items-center space-x-2">
                        <Skeleton width={20} height={20} />
                        <Skeleton width={40} height={16} />
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-1">
                      <Skeleton width={180} height={16} />
                      <Skeleton circle width={24} height={24} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        {/* Chat List */}
        <div className="space-y-2">
          {filteredChats.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-200">
              <MessageSquare className="h-12 w-12 mx-auto text-slate-200 mb-4" />
              <h3 className="text-lg font-bold text-slate-900 mb-1">
                {searchQueryProp ? t('pages:chatbox.empty.search') : t('pages:chatbox.empty.default')}
              </h3>
              <p className="text-slate-500 text-sm">
                {searchQueryProp ? t('pages:chatbox.empty.searchHint') : t('pages:chatbox.empty.defaultHint')}
              </p>
            </div>
          ) : (
            filteredChats.map((chat) => {
              const currentUserId = 'current_user' // In real app, get from auth
              const participant = chat.lawyer_id._id === currentUserId ? chat.client_id : chat.lawyer_id
              const participantName = `${participant.first_name} ${participant.last_name}`.trim() || t("pages:conv.user")

              return (
                <div
                  key={chat._id}
                  className="bg-white border border-slate-300 rounded-xl py-4 px-6 hover:shadow-sm transition-all cursor-pointer flex items-center group"
                  onClick={() => handleChatClick(chat)}
                >
                  <div className="flex-1 flex flex-col space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[15px] text-[#0F172A]">{participantName}</span>
                      {chat.unreadCount > 0 && (
                        <div className="w-5 h-5 bg-[#EF4444] rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                          N
                        </div>
                      )}
                    </div>
                    <p className="text-[13px] text-slate-600 font-medium">
                      {chat.lastMessage?.content || t("pages:chatbox.noMessages")}
                    </p>
                  </div>

                  <div className="flex items-center gap-8">
                    <span className="text-[13px] font-bold text-slate-900">
                      {chat.lastMessage
                        ? new Date(chat.lastMessage.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\./g, '.') + '.'
                        : new Date(chat.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\./g, '.') + '.'
                      }
                    </span>

                    <div className="flex items-center gap-3">
                      <button
                        className="p-2 text-slate-400 hover:text-slate-900 transition-colors"
                        onClick={(e) => handleDownloadChat(chat, e)}
                        title="Download Chat History"
                      >
                        <Download className="h-5 w-5" />
                      </button>
                      <button
                        className="p-2 text-slate-400 hover:text-[#EF4444] transition-colors"
                        onClick={(e) => handleDeleteClick(chat._id, e)}
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Chat Modal */}
      {showChat && selectedChat && (
        <SimpleChat
          onClose={() => {
            setShowChat(false)
            setSelectedChat(null)
            loadChats()
          }}
          chatId={selectedChat._id}
          clientName={
            selectedChat.lawyer_id._id === 'current_user'
              ? `${selectedChat.client_id.first_name} ${selectedChat.client_id.last_name}`.trim()
              : `${selectedChat.lawyer_id.first_name} ${selectedChat.lawyer_id.last_name}`.trim()
          }
          clientAvatar={
            selectedChat.lawyer_id._id === 'current_user'
              ? selectedChat.client_id.avatar
              : selectedChat.lawyer_id.avatar
          }
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('pages:chatbox.delete.confirm.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('pages:chatbox.delete.confirm.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDeleteChat}>
              {t('pages:chatbox.delete.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteChat}
              className="bg-red-600 hover:bg-red-700"
            >
              {t('pages:chatbox.delete.confirm.button')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
})

SimpleChatList.displayName = "SimpleChatList"

export default SimpleChatList