import ChatLayout from "@/components/layouts/chat-layout"
import ChatHeader from "@/components/chat/chat-header"
import ChatList from "@/components/chat/chat-list"
import { getChats } from "@/lib/api/chat-api"

export default async function ChatPage() {
  // this would use server-side data fetching
  const chats = await getChats()

  return (
    <ChatLayout>
      <div className="flex flex-col gap-6">
        <ChatHeader />
        <ChatList initialChats={chats} />
      </div>
    </ChatLayout>
  )
}
