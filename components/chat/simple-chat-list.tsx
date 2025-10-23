"use client"

import { useState, useEffect, forwardRef, useImperativeHandle } from "react"
import { Search, MessageSquare, Trash2, Loader2 } from "lucide-react"
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
  type Chat 
} from "@/lib/api/simple-chat-api"
import { useTranslation } from "@/hooks/useTranslation"
import Skeleton from "react-loading-skeleton"
import "react-loading-skeleton/dist/skeleton.css"

export interface SimpleChatListRef {
  refreshChats: () => void;
}

const SimpleChatList = forwardRef<SimpleChatListRef>((props, ref) => {
  const { t } = useTranslation()
  const [chats, setChats] = useState<Chat[]>([])
  const [filteredChats, setFilteredChats] = useState<Chat[]>([])
  const [searchQuery, setSearchQuery] = useState("")
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
    if (!searchQuery.trim()) {
      setFilteredChats(chats)
    } else {
      const filtered = chats.filter(chat => {
        const currentUserId = 'current_user' // Should come from Redux/auth
        const participant = chat.lawyer_id._id === currentUserId ? chat.client_id : chat.lawyer_id
        const participantName = `${participant.first_name} ${participant.last_name}`.toLowerCase()
        const lastMessage = chat.lastMessage?.content?.toLowerCase() || ''
        
        return participantName.includes(searchQuery.toLowerCase()) || 
               lastMessage.includes(searchQuery.toLowerCase())
      })
      setFilteredChats(filtered)
    }
  }, [chats, searchQuery])

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
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder={t('pages:chatbox.search.placeholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Chat List */}
        <div className="space-y-2">
          {filteredChats.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery ? t('pages:chatbox.empty.search') : t('pages:chatbox.empty.default')}
              </h3>
              <p className="text-gray-500">
                {searchQuery ? t('pages:chatbox.empty.searchHint') : t('pages:chatbox.empty.defaultHint')}
              </p>
            </div>
          ) : (
            filteredChats.map((chat) => {
              const currentUserId = 'current_user'
              const participant = chat.lawyer_id._id === currentUserId ? chat.client_id : chat.lawyer_id
              const participantName = `${participant.first_name} ${participant.last_name}`.trim()
              
              return (
                <Card 
                  key={chat._id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleChatClick(chat)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={participant.avatar || `/placeholder.svg?height=48&width=48`} />
                        <AvatarFallback>
                          {participantName.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {participantName}
                          </h3>
                          <div className="flex items-center space-x-2">
                            {chat.unreadCount > 0 && (
                              <Badge variant="default" className="bg-blue-500">
                                {chat.unreadCount}
                              </Badge>
                            )}
                            <span className="text-xs text-gray-500">
                              {chat.lastMessage ? formatTime(chat.lastMessage.createdAt) : formatTime(chat.createdAt)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-sm text-gray-600 truncate">
                            {chat.lastMessage?.content || t('pages:chatbox.noMessages')}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleDeleteClick(chat._id, e)}
                            className="opacity-100 transition-opacity"
                            aria-label={t('pages:chatbox.delete.button')}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
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