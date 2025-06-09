import type React from "react"
import Sidebar from "@/components/sidebar/sidebar"

interface CasesLayoutProps {
  children: React.ReactNode
}

export default function CasesLayout({ children }: CasesLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  )
}
