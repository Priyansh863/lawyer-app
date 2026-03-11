import type React from "react"
import DashboardLayout from "@/components/layouts/dashboard-layout"

interface QALayoutProps {
  children: React.ReactNode
}

export default function QALayout({ children }: QALayoutProps) {
  return (
    <DashboardLayout>
      {children}
    </DashboardLayout>
  )
}
