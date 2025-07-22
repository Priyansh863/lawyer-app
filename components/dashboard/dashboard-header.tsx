"use client"
import { RootState } from "@/lib/store"
import { useSelector } from "react-redux"
import { getGreeting } from "@/lib/helpers/greeting"

interface DashboardHeaderProps {}

export default function DashboardHeader({}: DashboardHeaderProps) {
  const user = useSelector((state: RootState) => state.auth.user)

  return (
    <header className="px-6 py-4 border-b">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          {getGreeting()}
        </h1>
  </header>
  )
}
