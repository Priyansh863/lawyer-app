"use client"
import React, { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare, Video, FileText, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"
import { getDashboardRecentActivity } from "@/services/user"

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
  const [activities, setActivities] = useState<ActivityItemProps[]>([
    {
      icon: <MessageSquare size={16} />,
      title: "New chat message",
      description: "Client John Doe sent you a message",
      time: "10m ago",
      iconColor: "bg-blue-100 text-blue-600",
    },
    {
      icon: <Video size={16} />,
      title: "Video consultation",
      description: "Completed consultation with Sarah Smith",
      time: "1h ago",
      iconColor: "bg-purple-100 text-purple-600",
    },
    {
      icon: <FileText size={16} />,
      title: "Document uploaded",
      description: "Contract for case #1234 uploaded",
      time: "3h ago",
      iconColor: "bg-green-100 text-green-600",
    },
    {
      icon: <Calendar size={16} />,
      title: "Appointment scheduled",
      description: "Court hearing for Smith vs. Jones",
      time: "5h ago",
      iconColor: "bg-amber-100 text-amber-600",
    },
  ])

  useEffect(() => {
    const fetchRecentActivity = async () => {
      try {
        const response = await getDashboardRecentActivity()
        if (response && response.data && response.data.success) {
          const activityData = response.data.data.map((activity: any) => ({
            icon: getActivityIcon(activity.type),
            title: activity.title,
            description: activity.description,
            time: activity.time,
            iconColor: getActivityIconColor(activity.type),
          }))
          setActivities(activityData)
        }
      } catch (error) {
        console.error("Failed to fetch recent activity:", error)
      }
    }

    fetchRecentActivity()
  }, [])

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "message":
        return <MessageSquare size={16} />
      case "video":
        return <Video size={16} />
      case "document":
        return <FileText size={16} />
      case "appointment":
        return <Calendar size={16} />
      default:
        return <MessageSquare size={16} />
    }
  }

  const getActivityIconColor = (type: string) => {
    switch (type) {
      case "message":
        return "bg-blue-100 text-blue-600"
      case "video":
        return "bg-purple-100 text-purple-600"
      case "document":
        return "bg-green-100 text-green-600"
      case "appointment":
        return "bg-amber-100 text-amber-600"
      default:
        return "bg-gray-100 text-gray-600"
    }
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-0 divide-y">
        {activities.map((activity, index) => (
          <ActivityItem
            key={index}
            icon={activity.icon}
            title={activity.title}
            description={activity.description}
            time={activity.time}
            iconColor={activity.iconColor}
          />
        ))}
      </CardContent>
    </Card>
  )
}
