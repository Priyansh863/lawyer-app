"use client"
import { RootState } from "@/lib/store"
import { useSelector } from "react-redux"
import { getGreeting } from "@/lib/helpers/greeting"
import { useTranslation } from "@/hooks/useTranslation"

interface DashboardHeaderProps {}

export default function DashboardHeader({}: DashboardHeaderProps) {
  const user = useSelector((state: RootState) => state.auth.user)
  const { t } = useTranslation()

  return (
    <header className="px-6 py-4 border-b">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          {t('dashboard.welcome')}{user?.first_name ? `, ${user.first_name}` : ''}
        </h1>
  </header>
  )
}
