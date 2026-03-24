import type React from "react"
import { useTranslation } from "@/hooks/useTranslation"

interface SettingsLayoutProps {
  children: React.ReactNode
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  const { t } = useTranslation()

  return (
    <main className="p-4 md:p-6 overflow-y-auto">
      <div className="mt-2">
        <h2 className="text-xl font-semibold mb-6">
          {t("pages:settings.title")}
        </h2>
        {children}
      </div>
    </main>
  )
}
