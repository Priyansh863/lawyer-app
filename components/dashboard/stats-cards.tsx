"use client"
import type React from "react"
import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { FileText, FileArchive, DollarSign, MessageSquare, Users, Home, Coins } from "lucide-react" // Added Users, Home, and Coins icons
import { activityApi, type DashboardSummary } from "@/lib/api/activity-api"
import { useSelector } from "react-redux"
import type { RootState } from "@/lib/store"
import { useTranslation } from "@/hooks/useTranslation"
import axios from "axios"

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
}

interface TokenBalance {
  current_balance: number
  total_purchased: number
  monthly_usage: number
}

function StatCard({ title, value, icon }: StatCardProps) {
  return (
    <Card className="relative overflow-hidden">
      {" "}
      {/* Added relative and overflow-hidden for the bottom line */}
      <CardContent className="p-6 pb-4">
        {" "}
        {/* Adjusted padding */}
        <div className="flex items-start justify-between">
          {" "}
          {/* Changed to items-start and justify-between */}
          {/* Removed the p-2 bg-gray-100 rounded-md wrapper */}
          <span className="text-sm text-gray-500">{title}</span> {/* Adjusted text style */}
          <div className="text-gray-500">{icon}</div> {/* Icon directly here, adjusted color */}
        </div>
        <div className="mt-4 text-3xl font-bold">{value}</div> {/* Adjusted margin and text size */}
      </CardContent>
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-600" /> {/* Added the purple bottom line */}
    </Card>
  )
}

export default function StatsCards() {
  const [stats, setStats] = useState<StatCardProps[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tokenBalance, setTokenBalance] = useState<TokenBalance | null>(null)
  const profile = useSelector((state: RootState) => state.auth.user)
  const { t } = useTranslation()

  useEffect(() => {
    fetchStats()
    if (profile?.account_type === 'client') {
      fetchTokenBalance()
    }
  }, [profile])

  async function fetchStats() {
    // Access user ID from Redux state
    const userId = profile?._id
    if (!userId) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      setError(null)
      const response = await activityApi.getDashboardSummary(userId)

      if (response.success && response.data) {
        const statsData = response.data.map((item: DashboardSummary) => ({
          title: item.title,
          value: item.value,
          icon: getIconForStat(item.icon, item.title),
        }))
        setStats(statsData)
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error)
      setError(t("common.error"))
      // Fallback to default stats
      setStats([
        { title: t("dashboard.activeCases"), value: 0, icon: <FileText size={18} /> },
        { title: t("dashboard.inactiveCases"), value: 0, icon: <FileArchive size={18} /> },
        { title: t("dashboard.todaysChats"), value: 0, icon: <MessageSquare size={18} /> },
      ])
    } finally {
      setLoading(false)
    }
  }

  const getToken = () => {
    if (typeof window !== "undefined") {
      const user = localStorage.getItem("user");
      return user ? JSON.parse(user).token : null;
    }
    return null;
  };

  async function fetchTokenBalance() {
    try {
      const token = getToken();
      if (!token) return;

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/user/tokens`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setTokenBalance(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching token balance:', error);
    }
  }

  const getIconForStat = (iconName: string, title: string) => {
    switch (iconName) {
      case "FileText":
        return <FileText size={18} />
      case "FileArchive":
        return <FileArchive size={18} />
      case "MessageSquare":
        return <MessageSquare size={18} />
      case "DollarSign":
        return <DollarSign size={18} />
      case "Users": // Added Users icon case
        return <Users size={18} />
      case "Home": // Added Home icon case
        return <Home size={18} />
      case "Coins": // Added Coins icon case for tokens
        return <Coins size={18} />
      default:
        // Fallback based on title
        if (title.toLowerCase().includes("active")) {
          return <FileText size={18} />
        } else if (title.toLowerCase().includes("inactive")) {
          return <FileArchive size={18} />
        } else if (title.toLowerCase().includes("chat")) {
          return <MessageSquare size={18} />
        } else if (title.toLowerCase().includes("total")) {
          // Fallback for 'total' to Users icon
          return <Users size={18} />
        } else {
          return <FileText size={18} />
        }
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="relative overflow-hidden">
            {" "}
            {/* Added relative and overflow-hidden */}
            <CardContent className="p-6 pb-4">
              {" "}
              {/* Adjusted padding */}
              <div className="animate-pulse">
                <div className="flex items-start justify-between">
                  {" "}
                  {/* Adjusted skeleton layout */}
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
                </div>
                <div className="mt-4 h-8 bg-gray-200 rounded w-16"></div> {/* Adjusted margin and height */}
              </div>
            </CardContent>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200" /> {/* Skeleton for the bottom line */}
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="col-span-full">
          <CardContent className="p-6 text-center text-red-500">
            <p>{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Prepare token stats for client users
  const tokenStats: StatCardProps[] = [];
  if (profile?.account_type === 'client' && tokenBalance) {
    tokenStats.push(
      {
        title: 'Available Tokens',
        value: tokenBalance.current_balance,
        icon: <Coins size={18} />
      },
      {
        title: 'Total Purchased',
        value: tokenBalance.total_purchased,
        icon: <DollarSign size={18} />
      },
      {
        title: 'Monthly Usage',
        value: tokenBalance.monthly_usage,
        icon: <MessageSquare size={18} />
      }
    );
  }

  // Combine stats and token stats
  const allStats = [...stats, ...tokenStats];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {allStats.map((stat, index) => (
        <StatCard key={`${stat.title}-${index}`} title={stat.title} value={stat.value} icon={stat.icon} />
      ))}
    </div>
  )
}
