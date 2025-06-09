import type React from "react"
import Sidebar from "@/components/sidebar/sidebar"

export default function AIMarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  )
}
