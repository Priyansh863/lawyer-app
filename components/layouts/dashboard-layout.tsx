"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Sidebar from "@/components/sidebar/sidebar"
import Header from "@/components/header/header"
import { Toaster } from "react-hot-toast"

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
    <div className="flex h-screen bg-[#f8f9fa] overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className={`flex-1 overflow-y-auto bg-transparent p-4 md:pt-4 md:px-8 md:pb-8 ${isMobile && isSidebarOpen ? "hidden md:block" : "block"}`}>
          <div className="max-w-7xl mx-auto w-full">
            {children}
            <Toaster />
          </div>
        </main>
      </div>
    </div>
  )
}