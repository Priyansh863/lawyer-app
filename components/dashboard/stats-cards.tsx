"use client"
import React from "react"
import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { FileText, FileArchive, DollarSign, MessageSquare, Users, Home, Coins } from "lucide-react"
import { activityApi, type DashboardSummary } from "@/lib/api/activity-api"
import { useSelector } from "react-redux"
import type { RootState } from "@/lib/store"
import { useTranslation } from "@/hooks/useTranslation"
import axios from "axios"

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  index: number
}

interface TokenBalance {
  current_balance: number
  total_purchased: number
  monthly_usage: number
}

function StatCard({ title, value, icon, index }: StatCardProps) {
  // Korean-style pastel color palette
  const cardColors = [
    "bg-gradient-to-br from-[#FFD8E0] to-[#FFAFBD]", // Soft pink
    "bg-gradient-to-br from-[#C2E9FB] to-[#A1C4FD]", // Soft blue
    "bg-gradient-to-br from-[#D4FC79] to-[#96E6A1]", // Soft green
    "bg-gradient-to-br from-[#FFECD2] to-[#FCB69F]", // Soft peach
    "bg-gradient-to-br from-[#E0C3FC] to-[#8EC5FC]", // Soft purple
    "bg-gradient-to-br from-[#FEE140] to-[#FA709A]", // Soft yellow to pink
  ]

  const iconColors = [
    "text-pink-600 bg-pink-100",
    "text-blue-600 bg-blue-100",
    "text-green-600 bg-green-100",
    "text-orange-600 bg-orange-100",
    "text-purple-600 bg-purple-100",
    "text-yellow-600 bg-yellow-100",
  ]

  const colorIndex = index % cardColors.length

  return (
    <Card className={`relative overflow-hidden border-0 shadow-lg rounded-2xl ${cardColors[colorIndex]} transition-all duration-300 hover:shadow-xl hover:-translate-y-1`}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-medium text-gray-700">{title}</div>
          <div className={`p-2 rounded-full ${iconColors[colorIndex]}`}>
            {icon}
          </div>
        </div>
        <div className="text-3xl font-bold text-gray-800">{value}</div>
        <div className="absolute -bottom-4 -right-4 w-16 h-16 rounded-full bg-white opacity-20"></div>
        <div className="absolute -bottom-6 -right-6 w-20 h-20 rounded-full bg-white opacity-10"></div>
      </CardContent>
    </Card>
  )
}

function StatsCards() {
  const [stats, setStats] = useState<StatCardProps[]>([])
  const [loading, setLoading] = useState(false)
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
    try {
      setLoading(true)
      setError(null)
      const response = await activityApi.getDashboardSummary(profile?._id || '')

      if (response.success && response.data) {
        const statsData = response.data.map((item: DashboardSummary, index: number) => ({
          title: t(`pages:stst.dashboard.${item.title.toLowerCase().replace(/\s+/g, '')}`),
          value: item.value,
          icon: getIconForStat(item.icon, item.title),
          index: index
        }))
        setStats(statsData)
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error)
      setError(t("pages:stst.common.error"))
      setStats([
        { title: t("pages:stst.dashboard.activecases"), value: 0, icon: <FileText size={18} />, index: 0 },
        { title: t("pages:stst.dashboard.inactivecases"), value: 0, icon: <FileArchive size={18} />, index: 1 },
        { title: t("pages:stst.dashboard.todayschats"), value: 0, icon: <MessageSquare size={18} />, index: 2 },
      ])
    } finally {
      setLoading(false)
    }
  }

  const getToken = () => {
    if (typeof window !== "undefined") {
      const user = localStorage.getItem("user")
      return user ? JSON.parse(user).token : null
    }
    return null
  }

  async function fetchTokenBalance() {
    try {
      console.log('Fetching token balance...')
      const token = getToken()
      console.log('Token found:', !!token)
      
      if (!token) {
        console.error('No authentication token found')
        setTokenBalance({
          current_balance: 0,
          total_purchased: 0,
          monthly_usage: 0
        })
        return
      }

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/user/tokens`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000 // 10 second timeout
        }
      )
      
      console.log('Token balance response:', response.data)

      if (response.data?.success) {
        setTokenBalance({
          current_balance: response.data.data?.current_balance || 0,
          total_purchased: response.data.data?.total_purchased || 0,
          monthly_usage: response.data.data?.monthly_usage || 0
        })
      } else {
        console.error('Invalid response format:', response.data)
        setTokenBalance({
          current_balance: 0,
          total_purchased: 0,
          monthly_usage: 0
        })
      }
    } catch (error) {
      console.error('Error fetching token balance:', error)
      // Set default values on error to ensure UI still renders
      setTokenBalance({
        current_balance: 0,
        total_purchased: 0,
        monthly_usage: 0
      })
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
      case "Users":
        return <Users size={18} />
      case "Home":
        return <Home size={18} />
      case "Coins":
        return <Coins size={18} />
      default:
        if (title.toLowerCase().includes("active")) {
          return <FileText size={18} />
        } else if (title.toLowerCase().includes("inactive")) {
          return <FileArchive size={18} />
        } else if (title.toLowerCase().includes("chat")) {
          return <MessageSquare size={18} />
        } else if (title.toLowerCase().includes("total")) {
          return <Users size={18} />
        } else {
          return <FileText size={18} />
        }
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="relative overflow-hidden border-0 shadow-lg rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200">
            <CardContent className="p-5">
              <div className="animate-pulse">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-4 bg-gray-300 rounded w-20"></div>
                  <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                </div>
                <div className="h-8 bg-gray-300 rounded w-16"></div>
              </div>
              <div className="absolute -bottom-4 -right-4 w-16 h-16 rounded-full bg-white opacity-20"></div>
              <div className="absolute -bottom-6 -right-6 w-20 h-20 rounded-full bg-white opacity-10"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
        <Card className="col-span-full border-0 shadow-lg rounded-2xl bg-gradient-to-br from-white to-gray-50">
          <CardContent className="p-6 text-center text-red-500">
            <p>{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const tokenStats: StatCardProps[] = []

  const allStats = [...stats, ...tokenStats]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
      {allStats.map((stat, index) => (
        <StatCard key={`${stat.title}-${index}`} title={stat.title} value={stat.value} icon={stat.icon} index={index} />
      ))}
    </div>
  )
}


export default React.memo(StatsCards)