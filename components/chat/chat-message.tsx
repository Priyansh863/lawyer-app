import { formatRelativeTime } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import type { Message } from "@/types/chat"

interface ChatMessageProps {
  message: Message
  isOutgoing: boolean
  showTokenCount?: boolean
}

export function ChatMessage({ message, isOutgoing, showTokenCount = false }: ChatMessageProps) {
  return (
    <div className={`flex ${isOutgoing ? "justify-end" : "justify-start"}`}>
      <div className={`flex gap-2 max-w-[80%] ${isOutgoing ? "flex-row-reverse" : ""}`}>
        {!isOutgoing && (
          <Avatar className="h-8 w-8 mt-1">
            <AvatarImage
              src={
                message.senderId === "ai_assistant"
                  ? "/placeholder.svg?height=32&width=32"
                  : "/placeholder.svg?height=32&width=32"
              }
              alt="Avatar"
            />
            <AvatarFallback>{message.senderId[0].toUpperCase()}</AvatarFallback>
          </Avatar>
        )}
        <div className="space-y-1">
          <div className={`p-3 rounded-lg ${isOutgoing ? "bg-[#0f0921] text-white" : "bg-white border"}`}>
            {message.content}
          </div>
          <div className={`flex items-center gap-2 text-xs text-gray-500 ${isOutgoing ? "justify-end" : ""}`}>
            <span>{formatRelativeTime(message.timestamp)}</span>
            {showTokenCount && message.tokenCount && (
              <Badge variant="outline" className="text-xs py-0 h-4">
                {message.tokenCount} tokens
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
