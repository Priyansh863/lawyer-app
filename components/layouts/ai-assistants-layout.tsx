import type React from "react"
import Sidebar from "@/components/sidebar/sidebar"

interface AIAssistantsLayoutProps {
  children: React.ReactNode
}

export default function AIAssistantsLayout({ children }: AIAssistantsLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  )
}
