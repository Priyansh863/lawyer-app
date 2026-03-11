import type { ReactNode } from "react"
import ClientLayout from "@/components/layouts/client-layout"

interface NotificationsLayoutProps {
    children: ReactNode
}

export default function NotificationsLayout({ children }: NotificationsLayoutProps) {
    return (
        <ClientLayout fullWidth>
            {children}
        </ClientLayout>
    )
}
