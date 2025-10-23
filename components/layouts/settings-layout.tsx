import type React from "react"
import DashboardHeader from "@/components/dashboard/dashboard-header"
import { useTranslation } from "@/hooks/useTranslation"

interface SettingsLayoutProps {
  children: React.ReactNode
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  const { t } = useTranslation()
  const user = {
    name: "Joseph",
    email: "joseph@example.com",
    avatar: "/placeholder.svg?height=32&width=32",
  }

  return (
    <main className="p-6 overflow-y-auto">
      {/* <DashboardHeader /> */}
      <div className="mt-10" style={{ marginTop: "2.25rem" }}>
        <h2 className="text-xl font-semibold mb-6">
          {t("pages:settings.title")}
        </h2>
        {children}
      </div>
    </main>
  )
}
