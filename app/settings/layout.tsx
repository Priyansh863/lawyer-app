import type { ReactNode } from "react"
import ClientLayout from "@/components/layouts/client-layout"

interface SettingsLayoutProps {
  children: ReactNode
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  return (
    <ClientLayout fullWidth>
      {children}
    </ClientLayout>
  )
}
