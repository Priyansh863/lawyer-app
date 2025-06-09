import type { User } from "@/types/user"

interface DashboardHeaderProps {
  user?: User
}

export default function DashboardHeader({ user }: DashboardHeaderProps) {
  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 18) return "Good afternoon"
    return "Good evening"
  }

  return (
    <header>
      <h1 className="text-2xl font-bold tracking-tight">
        {getGreeting()}
        {user?.name ? `, ${user.name}` : ""}
      </h1>
    </header>
  )
}
