"use client"

import { useState, useEffect } from "react"
import { Search, MessageSquare, Trash2, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { SimpleChat } from "@/components/chat/simple-chat"
import { 
  getUserChats, 
  deleteChat as deleteChatAPI, 
  type Chat 
} from "@/lib/api/simple-chat-api"

export default function SimpleChatList() {
  const [chats, setChats] = useState<Chat[]>([])
  const [filteredChats, setFilteredChats] = useState<Chat[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
  const [showChat, setShowChat] = useState(false)
  const { toast } = useToast()

  // Load chats on component mount
  useEffect(() => {
    loadChats()
  }, [])

  // Filter chats based on search query
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
        title: "Error",
        description: "Failed to load chats",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent opening chat when delete is clicked
    
    try {
      await deleteChatAPI(chatId)
      setChats(prev => prev.filter(chat => chat._id !== chatId))
      toast({
        title: "Chat deleted",
        description: "The chat has been deleted successfully",
      })
    } catch (error) {
      console.error('Error deleting chat:', error)
      toast({
        title: "Error",
        description: "Failed to delete chat",
        variant: "destructive",
      })
    }
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
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-3">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading chats...</span>
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
            placeholder="Search conversations..."
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
                {searchQuery ? 'No chats found' : 'No conversations yet'}
              </h3>
              <p className="text-gray-500">
                {searchQuery 
                  ? 'Try adjusting your search terms' 
                  : 'Start a conversation with a client from their profile page'
                }
              </p>
            </div>
          ) : (
            filteredChats.map((chat) => {
              const currentUserId = 'current_user' // Should come from Redux/auth
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
                            {chat.lastMessage?.content || 'No messages yet'}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleDeleteChat(chat._id, e)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
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
            loadChats() // Refresh chats after closing
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
    </>
  )
}
