"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Sidebar from "@/components/sidebar/sidebar"
// import AppHeader from "@/components/header/app-header"

interface AIMarketingLayoutProps {
  children: React.ReactNode
}

export default function AIMarketingLayout({ children }: AIMarketingLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkIfMobile()
    window.addEventListener("resize", checkIfMobile)

    return () => {
      window.removeEventListener("resize", checkIfMobile)
    }
  }, [])

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col md:ml-0">
        <div className={`fixed top-0 z-30 ${isMobile ? "left-0 right-0" : "left-64 right-0"}`}>
          {/* <AppHeader onMenuClick={toggleSidebar} /> */}
        </div>
        <main className="flex-1 w-full">
          <div className="md:p-6 px-4">
            <div className="pt-20 md:pt-6 max-w-7xl mx-auto">{children}</div>
          </div>
        </main>
      </div>
    </div>
  )
}
