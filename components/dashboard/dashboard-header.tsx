"use client"
import { RootState } from "@/lib/store"
import { useSelector } from "react-redux"
import { getGreeting } from "@/lib/helpers/greeting"
import { useTranslation } from "@/hooks/useTranslation"

interface DashboardHeaderProps { }

export default function DashboardHeader() {
  const user = useSelector((state: RootState) => state.auth.user)
  const { t } = useTranslation()

  return (
    <header className="h-14 border-b border-gray-100 dark:border-slate-700 bg-white/50 dark:bg-slate-900/70 backdrop-blur-md flex items-center justify-end px-8 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-semibold text-gray-900 dark:text-slate-100 leading-tight">
            {user?.first_name} {user?.last_name}
          </p>
        </div>
        <div className="w-8 h-8 rounded-full bg-[#0F172A] flex items-center justify-center text-white text-xs font-bold">
          {user?.first_name?.[0]}{user?.last_name?.[0]}
        </div>
      </div>
    </header>
  )
}