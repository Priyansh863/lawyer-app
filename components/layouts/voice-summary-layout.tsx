import type React from "react"
import Sidebar from "@/components/sidebar/sidebar"
import Header from "@/components/header/header"

interface VoiceSummaryLayoutProps {
  children: React.ReactNode
}

export default function VoiceSummaryLayout({ children }: VoiceSummaryLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  )
}
