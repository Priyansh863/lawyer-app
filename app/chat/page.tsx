"use client"

import ChatLayout from "@/components/layouts/chat-layout"
import SimpleChatList from "@/components/chat/simple-chat-list"
import { useTranslation } from "@/hooks/useTranslation"

export default function ChatPage() {
  const { t } = useTranslation()
  
  return (
    <ChatLayout>
      <div className="space-y-0">
        <div className="space-y-4 mt-10">
          <h1 className="text-2xl font-bold tracking-tight">{t('pages:chat.title')}</h1>
          <h2 className="text-lg text-gray-600">{t('pages:chat.description')}</h2>
        </div>
        <SimpleChatList />
      </div>
    </ChatLayout>
  )
}
