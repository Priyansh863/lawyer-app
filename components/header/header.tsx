"use client"

import { useSelector } from "react-redux"
import { RootState } from "@/lib/store"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function Header() {
    const user = useSelector((state: RootState) => state.auth.user)

    return (
        <header className="h-16 border-b border-slate-200 bg-[#f8f9fa] flex items-center justify-end px-8 sticky top-0 z-50">
            <div className="flex items-center gap-3 group cursor-pointer hover:bg-slate-50 p-1.5 pr-3 rounded-full transition-colors">
                <div className="w-9 h-9 rounded-full bg-[#0F172A] flex items-center justify-center border border-slate-100 group-hover:border-slate-300 transition-all overflow-hidden shadow-sm">
                    <Avatar className="w-full h-full">
                        <AvatarImage src={user?.profile_image ?? ""} />
                        <AvatarFallback className="bg-[#0F172A] text-white font-bold text-xs">
                            {user?.first_name?.[0]}{user?.last_name?.[0]}
                        </AvatarFallback>
                    </Avatar>
                </div>
                <div className="flex flex-col">
                    <p className="text-sm font-semibold text-slate-900 leading-none">
                        {user?.first_name} {user?.last_name || "User"}
                    </p>
                </div>
            </div>
        </header>
    )
}
