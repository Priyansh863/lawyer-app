import type React from "react"
import Sidebar from "@/components/sidebar/sidebar"
import Header from "@/components/header/header"

interface CasesLayoutProps {
  children: React.ReactNode
}

export default function CasesLayout({ children }: CasesLayoutProps) {
  return (
    <div className="flex h-screen bg-[#f8f9fa] overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 pt-1 px-8 pb-8 overflow-y-auto bg-transparent">
          {children}
        </main>
      </div>
    </div>
  )
}
