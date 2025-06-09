import type React from "react"
import Sidebar from "@/components/sidebar/sidebar"
import DashboardHeader from "@/components/dashboard/dashboard-header"

interface QALayoutProps {
  children: React.ReactNode
}

export default function QALayout({ children }: QALayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-6 overflow-y-auto">
        <DashboardHeader />
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  )
}
