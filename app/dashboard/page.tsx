import DashboardLayout from "@/components/layouts/dashboard-layout"
import DashboardHeader from "@/components/dashboard/dashboard-header"
import StatsCards from "@/components/dashboard/stats-cards"
import RecentActivity from "@/components/dashboard/recent-activity"
import QuickActions from "@/components/dashboard/quick-actions"
import { getCurrentUser } from "@/lib/auth-utils"

export default async function DashboardPage() {
  // This would be replaced with actual authentication in production
  const user = await getCurrentUser()

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <DashboardHeader user={user} />
        <StatsCards />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <RecentActivity />
          <QuickActions />
        </div>
      </div>
    </DashboardLayout>
  )
}
