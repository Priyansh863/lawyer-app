import ChatLayout from "@/components/layouts/chat-layout"
import SimpleChatList from "@/components/chat/simple-chat-list"

export default function ChatPage() {
  return (
    <ChatLayout>
      <div className="space-y-6">
        <div className="space-y-4">
          <h1 className="text-2xl font-bold tracking-tight">Chat</h1>
          <h2 className="text-lg text-gray-600">Manage your conversations with clients</h2>
        </div>
        <SimpleChatList />
      </div>
    </ChatLayout>
  )
}
