import type React from "react"
import ClientLayout from "@/components/layouts/client-layout"

interface TokenLayoutProps {
  children: React.ReactNode
}

export default function TokenLayout({ children }: TokenLayoutProps) {
  return (
    <ClientLayout fullWidth>
      {children}
    </ClientLayout>
  )
}
