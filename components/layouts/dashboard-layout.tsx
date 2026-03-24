"use client"

import type React from "react"
import Sidebar from "@/components/sidebar/sidebar"
import Header from "@/components/header/header"
import { Toaster } from "react-hot-toast"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen bg-[#f8f9fa] overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-transparent p-4 md:pt-4 md:px-8 md:pb-8">
          <div className="max-w-7xl mx-auto w-full">
            {children}
            <Toaster />
          </div>
        </main>
      </div>
    </div>
  )
}