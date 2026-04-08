"use client"

import { useSelector } from "react-redux"
import { RootState } from "@/lib/store"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { SidebarContent } from "@/components/sidebar/sidebar"
import { useState } from "react"
import NotificationBell from "@/components/notifications/NotificationBell"

export default function Header() {
    const user = useSelector((state: RootState) => state.auth.user)
    const [open, setOpen] = useState(false)

    return (
        <header className="h-16 border-b border-slate-200 bg-white md:bg-[#f8f9fa] flex items-center justify-between md:justify-end px-4 md:px-8 sticky top-0 z-50">
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
                <h1 className="text-xl font-serif font-bold text-[#0F172A] tracking-tight md:hidden">Lawgg</h1>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
                <div className="md:hidden">
                    <NotificationBell />
                </div>
                
                <div className="flex items-center gap-3 group cursor-pointer hover:bg-slate-50 p-1.5 pl-3 rounded-full transition-colors">
                    <div className="hidden sm:flex flex-col text-right">
                        <p className="text-sm font-semibold text-slate-900 leading-none">
                            {user?.first_name} {user?.last_name || "User"}
                        </p>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-[#0F172A] flex items-center justify-center border border-slate-100 group-hover:border-slate-300 transition-all overflow-hidden shadow-sm">
                        <Avatar className="w-full h-full">
                            <AvatarImage src={user?.profile_image ?? ""} />
                            <AvatarFallback className="bg-[#0F172A] text-white font-bold text-xs">
                                {user?.first_name?.[0]}{user?.last_name?.[0]}
                            </AvatarFallback>
                        </Avatar>
                    </div>
                </div>
            </div>
        </header>
    )
}

