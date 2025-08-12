"use client";

import DashboardLayout from "@/components/layouts/dashboard-layout"
import DashboardHeader from "@/components/dashboard/dashboard-header"
import StatsCards from "@/components/dashboard/stats-cards"
import RecentActivity from "@/components/dashboard/recent-activity"
import QuickActions from "@/components/dashboard/quick-actions"
import ClientAnalytics from "@/components/dashboard/client-analytics"
import { useSelector } from "react-redux"
import { RootState } from "@/lib/store"

export default function DashboardPage() {
  const profile = useSelector((state: RootState) => state.auth.user);

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <DashboardHeader />
        <StatsCards />
        
        {/* Conditional rendering for client analytics */}
        {profile?.account_type === 'client' && (
          <ClientAnalytics />
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <RecentActivity />
          <QuickActions />
        </div>
      </div>
    </DashboardLayout>
  )
}
