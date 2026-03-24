"use client"

import type React from "react"
import Sidebar from "@/components/sidebar/sidebar"
import Header from "@/components/header/header"

interface AIMarketingLayoutProps {
  children: React.ReactNode
}

export default function AIMarketingLayout({ children }: AIMarketingLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6">
            <div className="max-w-7xl mx-auto">{children}</div>
          </div>
        </main>
      </div>
    </div>
  )
}
