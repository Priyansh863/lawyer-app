"use client"

import { useState } from "react"
import ChatLayout from "@/components/layouts/chat-layout"
import SimpleChatList from "@/components/chat/simple-chat-list"
import { useTranslation } from "@/hooks/useTranslation"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import ChatConsultationModal from "@/components/modals/chat-consultation-modal"
import { useToast } from "@/hooks/use-toast"

export default function ChatPage() {
  const { t } = useTranslation()
  const [isConsultationModalOpen, setIsConsultationModalOpen] = useState(false)
  const { toast } = useToast()

  const handleConsultationScheduled = () => {
    toast({
      title: t("pages:common.success"),
      description: t("pages:consultation.requestSentSuccess"),
    })
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
        <SimpleChatList />
      </div>

      <ChatConsultationModal
        isOpen={isConsultationModalOpen}
        onClose={() => setIsConsultationModalOpen(false)}
        onConsultationScheduled={handleConsultationScheduled}
      />
    </ChatLayout>
  )
}