import type { ReactNode } from "react"
import Sidebar from "@/components/sidebar/sidebar"

interface SubscriptionLayoutProps {
  children: ReactNode
}

export default function SubscriptionLayout({ children }: SubscriptionLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1">{children}</div>
    </div>
  )
}
