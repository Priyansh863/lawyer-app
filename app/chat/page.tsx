"use client"

import { useState, useRef } from "react"
import ChatLayout from "@/components/layouts/chat-layout"
import SimpleChatList, { SimpleChatListRef } from "@/components/chat/simple-chat-list"
import { SimpleChat } from "@/components/chat/simple-chat"
import { useTranslation } from "@/hooks/useTranslation"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import ChatConsultationModal from "@/components/modals/chat-consultation-modal"
import { useToast } from "@/hooks/use-toast"

interface User {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  account_type: "client" | "lawyer";
  profile_image?: string;
  chat_rate?: number;
}

export default function ChatPage() {
  const { t } = useTranslation()
  const [isConsultationModalOpen, setIsConsultationModalOpen] = useState(false)
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showChat, setShowChat] = useState(false)
  const chatListRef = useRef<SimpleChatListRef | null>(null)
  const { toast } = useToast()

  const handleConsultationScheduled = () => {
    toast({
      title: t("pages:common.success"),
      description: t("pages:consultation.requestSentSuccess"),
    })
  }

  const handleChatStarted = (chatId: string, user: User) => {
    // Refresh the chat list
    if (chatListRef.current?.refreshChats) {
      chatListRef.current.refreshChats()
    }

    // Open the chat modal with the new chat
    setSelectedChatId(chatId)
    setSelectedUser(user)
    setShowChat(true)
  }

  const handleCloseChat = () => {
    setShowChat(false)
    setSelectedChatId(null)
    setSelectedUser(null)
  }
  
  return (
    <ChatLayout>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">{t('pages:chat.title')}</h1>
            <p className="text-muted-foreground">
              {t('pages:chat.description')}
            </p>
          </div>
          <Button
            onClick={() => setIsConsultationModalOpen(true)}
            className="bg-primary hover:bg-primary/90 text-white gap-2"
          >
            <Plus className="w-4 h-4" />
            {t("pages:consultation.newConsultation")}
          </Button>
        </div>
        <SimpleChatList ref={chatListRef} />
      </div>

      <ChatConsultationModal
        isOpen={isConsultationModalOpen}
        onClose={() => setIsConsultationModalOpen(false)}
        onConsultationScheduled={handleConsultationScheduled}
        onChatStarted={handleChatStarted}
      />

      {/* Chat Modal */}
      {showChat && selectedChatId && selectedUser && (
        <SimpleChat
          onClose={handleCloseChat}
          clientId={selectedUser._id}
          clientName={`${selectedUser.first_name} ${selectedUser.last_name}`}
          clientAvatar={selectedUser.profile_image}
          chatId={selectedChatId}
          chatRate={selectedUser.chat_rate}
        />
      )}
    </ChatLayout>
  )
}