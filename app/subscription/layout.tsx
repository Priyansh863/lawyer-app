import type { ReactNode } from "react"
import Sidebar from "@/components/sidebar/sidebar"
import Header from "@/components/header/header"

interface SubscriptionLayoutProps {
  children: ReactNode
}

export default function SubscriptionLayout({ children }: SubscriptionLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

