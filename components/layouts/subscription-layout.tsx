import type React from "react"
import DashboardHeader from "@/components/dashboard/dashboard-header"

interface SubscriptionLayoutProps {
  children: React.ReactNode
}

export default function SubscriptionLayout({ children }: SubscriptionLayoutProps) {
  const user = {
    name: "Joseph",
    email: "joseph@example.com",
    avatar: "/placeholder.svg?height=32&width=32",
  }

  return (
    <main className="p-6 overflow-y-auto">
      <DashboardHeader  />
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-6">Subscription</h2>
        {children}
      </div>
    </main>
  )
}
