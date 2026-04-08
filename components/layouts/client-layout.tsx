"use client"
import Sidebar from "@/components/sidebar/sidebar"
import { SidebarContent } from "@/components/sidebar/sidebar"
import { useSelector } from "react-redux"
import type { RootState } from "@/lib/store"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useState } from "react"
import NotificationBell from "@/components/notifications/NotificationBell"

interface ClientLayoutProps {
  children: React.ReactNode
  fullWidth?: boolean
}

export default function ClientLayout({ children, fullWidth = false }: ClientLayoutProps) {
  const user = useSelector((state: RootState) => state.auth.user)
  const [open, setOpen] = useState(false)

  return (
    <div className="flex h-screen bg-[#f8f9fa] overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 flex-shrink-0 flex items-center justify-between md:justify-end px-4 md:px-8 bg-white md:bg-[#f8f9fa] border-b border-slate-200 z-30">
          {/* Mobile Hamburger */}
          <div className="md:hidden flex items-center gap-2">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64">
                <SidebarContent onNavItemClick={() => setOpen(false)} />
              </SheetContent>
            </Sheet>
            <h1 className="text-xl font-serif font-bold text-[#0F172A] tracking-tight">Lawgg</h1>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <div className="md:hidden">
              <NotificationBell />
            </div>
            
            <div className="flex items-center gap-3 group cursor-pointer hover:bg-slate-50 p-1.5 pl-3 rounded-full transition-colors">
              <div className="hidden sm:flex flex-col text-right">
                <p className="text-sm font-semibold text-slate-900 leading-none">
                  {user ? `${user.first_name} ${user.last_name || "User"}` : "Satoshi moto"}
                </p>
              </div>
              <div className="w-9 h-9 rounded-full bg-[#0F172A] flex items-center justify-center border border-slate-100 group-hover:border-slate-300 transition-all overflow-hidden shadow-sm">
                <Avatar className="w-full h-full">
                  <AvatarImage src={user?.profile_image} />
                  <AvatarFallback className="bg-[#0F172A] text-white font-bold text-xs">
                    {user?.first_name?.[0]}{user?.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 md:px-8 md:pt-4 md:pb-8 overflow-y-auto">
          <div className={fullWidth ? "" : "max-w-7xl mx-auto"}>{children}</div>
        </main>
      </div>
    </div>
  )
}
