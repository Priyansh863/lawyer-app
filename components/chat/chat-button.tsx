"use client"

import { useState } from "react"
import { MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ChatPopup } from "@/components/chat/chat-popup"
import { cn } from "@/lib/utils"

interface ChatButtonProps {
  className?: string
}

export function ChatButton({ className }: ChatButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeClientId, setActiveClientId] = useState<string | null>(null)

  const toggleChat = (clientId?: string) => {
    if (clientId) {
      setActiveClientId(clientId)
      setIsOpen(true)
    } else {
      setIsOpen(!isOpen)
    }
  }

  const closeChat = () => {
    setIsOpen(false)
  }

  return (
    <>
      <Button
        onClick={() => toggleChat()}
        className={cn(
          "fixed bottom-4 right-4 rounded-full w-12 h-12 p-0 shadow-lg bg-[#0f0921] hover:bg-[#0f0921]/90",
          className,
        )}
        aria-label="Open chat"
      >
        <MessageSquare className="h-5 w-5 text-white" />
      </Button>

      {isOpen && <ChatPopup onClose={closeChat} clientId={activeClientId} />}
    </>
  )
}
