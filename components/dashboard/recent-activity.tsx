"use client"
import React, { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare, Video, FileText, Calendar, Clock, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { activityApi, Activity } from "@/lib/api/activity-api"
import { useSelector } from "react-redux"
import { RootState } from "@/lib/store"

interface ActivityItemProps {
  icon: React.ReactNode
  title: string
  description: string
  time: string
  iconColor?: string
}

function ActivityItem({ icon, title, description, time, iconColor = "bg-gray-100" }: ActivityItemProps) {
  return (
    <div className="flex items-start gap-4 py-3">
      <div className={cn("p-2 rounded-md", iconColor)}>{icon}</div>
      <div className="flex-1 space-y-1">
        <p className="font-medium">{title}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <div className="text-xs text-gray-400">{time}</div>
    </div>
  )
}

export default function RecentActivity() {
  const [activities, setActivities] = useState<ActivityItemProps[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const profile = useSelector((state: RootState) => state.auth.user)

  useEffect(() => {
    const fetchRecentActivity = async () => {
      // Access user ID from Redux state
      const userId = profile?._id
      if (!userId) return
      
      try {
        setLoading(true)
        setError(null)
        const response = await activityApi.getActivities(userId)
        
        if (response.success && response.data) {
          const activityData = response.data.map((activity: Activity) => ({
            icon: getActivityIcon(activity.activity_name),
            title: activity.activity_name,
            description: activity.description,
            time: formatTimeAgo(activity.created_at),
            iconColor: getActivityIconColor(activity.activity_name),
          }))
          setActivities(activityData)
        }
      } catch (error) {
        console.error("Failed to fetch recent activity:", error)
        setError("Failed to load recent activity")
        // Fallback to some default activities
        setActivities([
          {
            icon: <Clock size={16} />,
            title: "No recent activity",
            description: "Your recent activities will appear here",
            time: "--",
            iconColor: "bg-gray-100 text-gray-600",
          }
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchRecentActivity()
  }, [profile])

  const getActivityIcon = (activityName: string) => {
    const name = activityName.toLowerCase()
    if (name.includes('message') || name.includes('chat')) {
      return <MessageSquare size={16} />
    } else if (name.includes('video') || name.includes('call')) {
      return <Video size={16} />
    } else if (name.includes('document') || name.includes('file')) {
      return <FileText size={16} />
    } else if (name.includes('appointment') || name.includes('meeting')) {
      return <Calendar size={16} />
    } else if (name.includes('user') || name.includes('profile')) {
      return <User size={16} />
    } else {
      return <Clock size={16} />
    }
  }

  const getActivityIconColor = (activityName: string) => {
    const name = activityName.toLowerCase()
    if (name.includes('message') || name.includes('chat')) {
      return "bg-blue-100 text-blue-600"
    } else if (name.includes('video') || name.includes('call')) {
      return "bg-purple-100 text-purple-600"
    } else if (name.includes('document') || name.includes('file')) {
      return "bg-green-100 text-green-600"
    } else if (name.includes('appointment') || name.includes('meeting')) {
      return "bg-amber-100 text-amber-600"
    } else if (name.includes('user') || name.includes('profile')) {
      return "bg-indigo-100 text-indigo-600"
    } else {
      return "bg-gray-100 text-gray-600"
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds}s ago`
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)}m ago`
    } else if (diffInSeconds < 86400) {
      return `${Math.floor(diffInSeconds / 3600)}h ago`
    } else {
      return `${Math.floor(diffInSeconds / 86400)}d ago`
    }
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-0 divide-y">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">
            <p>{error}</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>No recent activity found</p>
          </div>
        ) : (
          activities.map((activity, index) => (
            <ActivityItem
              key={index}
              icon={activity.icon}
              title={activity.title}
              description={activity.description}
              time={activity.time}
              iconColor={activity.iconColor}
            />
          ))
        )}
      </CardContent>
    </Card>
  )
}
