"use client"
import React, { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { FileText, FileArchive, DollarSign, MessageSquare } from "lucide-react"
import { activityApi, DashboardSummary } from "@/lib/api/activity-api"
import { useSelector } from "react-redux"
import { RootState } from "@/lib/store"

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
}

function StatCard({ title, value, icon }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gray-100 rounded-md">{icon}</div>
          <span className="text-sm font-medium text-gray-500">{title}</span>
        </div>
        <div className="mt-2 text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  )
}

export default function StatsCards() {
  const [stats, setStats] = useState<StatCardProps[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const profile = useSelector((state: RootState) => state.auth.user)

  useEffect(() => {
    fetchStats()
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
          icon: getIconForStat(item.icon, item.title)
        }))
        setStats(statsData)
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error)
      setError("Failed to load dashboard statistics")
      // Fallback to default stats
      setStats([
        { title: "Active Cases", value: 0, icon: <FileText size={18} /> },
        { title: "Inactive Cases", value: 0, icon: <FileArchive size={18} /> },
        { title: "Today's Chats", value: 0, icon: <MessageSquare size={18} /> },
      ])
    } finally {
      setLoading(false)
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
      default:
        // Fallback based on title
        if (title.toLowerCase().includes('active')) {
          return <FileText size={18} />
        } else if (title.toLowerCase().includes('inactive')) {
          return <FileArchive size={18} />
        } else if (title.toLowerCase().includes('chat')) {
          return <MessageSquare size={18} />
        } else {
          return <FileText size={18} />
        }
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-gray-200 rounded-md"></div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                </div>
                <div className="mt-2 h-8 bg-gray-200 rounded w-16"></div>
              </div>
            </CardContent>
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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <StatCard key={stat.title} title={stat.title} value={stat.value} icon={stat.icon} />
      ))}
    </div>
  )
}
