"use client"
import Sidebar from "@/components/sidebar/sidebar"
import { useSelector } from "react-redux"
import type { RootState } from "@/lib/store"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface ClientLayoutProps {
  children: React.ReactNode
  fullWidth?: boolean
}

export default function ClientLayout({ children, fullWidth = false }: ClientLayoutProps) {
  const user = useSelector((state: RootState) => state.auth.user)

  return (
    <div className="flex h-screen bg-[#f8f9fa] overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 flex-shrink-0 flex items-center justify-end px-8 bg-[#f8f9fa] border-b border-slate-200 z-30">
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <span className="text-sm font-medium text-[#0F172A]">
                {user ? `${user.first_name} ${user.last_name || ""}` : "Satoshi moto"}
              </span>
            </div>
            <Avatar className="h-9 w-9 bg-[#0F172A]">
              <AvatarImage src={user?.profile_image} />
              <AvatarFallback className="bg-[#0F172A] text-white">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>
        <main className="flex-1 px-8 pt-4 pb-8 overflow-y-auto">
          <div className={fullWidth ? "" : "max-w-7xl mx-auto"}>{children}</div>
        </main>
      </div>
    </div>
  )
}
