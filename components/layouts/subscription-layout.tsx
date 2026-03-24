import type React from "react"
import Sidebar from "@/components/sidebar/sidebar"
import Header from "@/components/header/header"

interface SubscriptionLayoutProps {
  children: React.ReactNode
}

export default function SubscriptionLayout({ children }: SubscriptionLayoutProps) {
  return (
    <div className="flex h-screen bg-[#f8f9fa] overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          <div className="mt-2">
            <h2 className="text-xl font-semibold mb-6">Subscription</h2>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
