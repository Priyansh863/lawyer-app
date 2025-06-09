"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Sidebar from "@/components/sidebar/sidebar"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Check if mobile and listen for sidebar open/close events
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    // Initial check
    checkIfMobile()

    const handleSidebarChange = (e: CustomEvent) => {
      setIsSidebarOpen(e.detail.isOpen)
    }

    window.addEventListener("sidebarChange" as any, handleSidebarChange)
    window.addEventListener("resize", checkIfMobile)

    return () => {
      window.removeEventListener("sidebarChange" as any, handleSidebarChange)
      window.removeEventListener("resize", checkIfMobile)
    }
  }, [])

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      {/* Use display:none instead of opacity for complete hiding */}
      <main className={`flex-1 w-full ${isMobile && isSidebarOpen ? "hidden" : "block"}`}>
        <div className="md:p-6 px-4">
          <div className="pt-24 md:pt-0 max-w-7xl mx-auto">{children}</div>
        </div>
      </main>
    </div>
  )
}
