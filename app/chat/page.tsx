"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import ClientLayout from "@/components/layouts/client-layout"
import SimpleChatList, { SimpleChatListRef } from "@/components/chat/simple-chat-list"
import { SimpleChat } from "@/components/chat/simple-chat"
import { useTranslation } from "@/hooks/useTranslation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus } from "lucide-react"
import ChatConsultationModal from "@/components/modals/chat-consultation-modal"
import { useToast } from "@/hooks/use-toast"

export default function ChatPage() {
  const { t } = useTranslation()
  const [isConsultationModalOpen, setIsConsultationModalOpen] = useState(false)
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<any | null>(null)
  const [showChat, setShowChat] = useState(false)
  const chatListRef = useRef<SimpleChatListRef | null>(null)
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")

  // Check for openModal parameter on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const shouldOpenModal = urlParams.get('openModal')
      if (shouldOpenModal === 'true') {
        setIsConsultationModalOpen(true)
      }
    }
  }, [])

  const handleConsultationScheduled = () => {
    toast({
      title: t("pages:common.success"),
      description: t("pages:consultation.requestSentSuccess"),
    })
  }

  const handleChatStarted = (chatId: string, user: any) => {
    if (chatListRef.current?.refreshChats) {
      chatListRef.current.refreshChats()
    }
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
    <ClientLayout fullWidth>
      <div className="pt-1 pb-4 px-2 max-w-[1700px]">
        <div className="flex flex-col space-y-8">
          {/* Header Section */}
          <div className="flex justify-between items-center">
            <h1 className="text-[22px] font-bold text-[#0F172A] tracking-tight">{t("pages:chat.title")}</h1>
            <div className="flex items-center gap-4">
              <div className="relative w-[280px]">
                <Input
                  placeholder={t("pages:chat.searchChats")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-11 bg-white border-slate-300 rounded-md focus-visible:ring-0 focus-visible:border-slate-400 placeholder:text-slate-500 font-medium pl-4"
                />
              </div>
              <Button
                onClick={() => setIsConsultationModalOpen(true)}
                className="bg-[#1E293B] hover:bg-[#0F172A] text-white px-6 h-11 rounded-md font-bold text-[14px] transition-all shadow-sm"
              >
                {t("pages:consultation.newConsultation")}
              </Button>
            </div>
          </div>

          <SimpleChatList
            ref={chatListRef}
            searchQueryProp={searchQuery}
            onNewChatClick={() => setIsConsultationModalOpen(true)}
          />
        </div>

        <ChatConsultationModal
          isOpen={isConsultationModalOpen}
          onClose={() => setIsConsultationModalOpen(false)}
          onConsultationScheduled={handleConsultationScheduled}
          onChatStarted={handleChatStarted}
        />

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
      </div>
    </ClientLayout>
  )
}