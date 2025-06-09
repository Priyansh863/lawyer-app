import type React from "react"
import DashboardHeader from "@/components/dashboard/dashboard-header"

interface SettingsLayoutProps {
  children: React.ReactNode
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  const user = {
    name: "Joseph",
    email: "joseph@example.com",
    avatar: "/placeholder.svg?height=32&width=32",
  }

  return (
    <main className="p-6 overflow-y-auto">
      <DashboardHeader user={user} />
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-6">Settings</h2>
        {children}
      </div>
    </main>
  )
}
