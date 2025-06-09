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

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
    // Dispatch custom event for sidebar
    window.dispatchEvent(
      new CustomEvent("sidebarChange", {
        detail: { isOpen: !isSidebarOpen },
      }),
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col md:ml-0">
        {/* Header positioned to not overlap sidebar on desktop */}
        
        <main className={`flex-1 w-full ${isMobile && isSidebarOpen ? "hidden" : "block"}`}>
          <div className="md:p-4 px-3">
            <div className="pt-20 md:pt-4 max-w-7xl mx-auto">{children}</div>
          </div>
        </main>
      </div>
    </div>
  )
}
