import type { ReactNode } from "react"
import Sidebar from "@/components/sidebar/sidebar"

interface SettingsLayoutProps {
  children: ReactNode
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1">{children}</div>
    </div>
  )
}
