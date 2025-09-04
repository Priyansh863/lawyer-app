"use client"
import React, { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare, Video, FileText, Calendar, Clock, User, Bell, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import { activityApi, Activity } from "@/lib/api/activity-api"
import { useNotifications } from "@/contexts/NotificationContext"
import { useSelector } from "react-redux"
import { RootState } from "@/lib/store"
import { useTranslation } from "@/hooks/useTranslation"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"

interface ActivityItemProps {
  icon: React.ReactNode
  title: string
  description: string
  time: string
  iconColor?: string
  bgColor?: string
  onClick?: () => void
}

function ActivityItem({ icon, title, description, time, iconColor = "text-primary", bgColor = "from-primary/10 to-accent/20", onClick }: ActivityItemProps) {
  return (
    <div 
      className={cn(
        "flex items-start gap-4 p-3 rounded-lg transition-all duration-300 group cursor-pointer",
        "bg-gradient-to-r", bgColor,
        onClick && "hover:shadow-md hover:-translate-y-0.5"
      )}
      onClick={onClick}
    >
      <div className={cn("p-2 rounded-xl bg-white/60 backdrop-blur-sm", iconColor, "group-hover:scale-110 transition-transform duration-300")}>
        {icon}
      </div>
      <div className="flex-1 space-y-1 min-w-0">
        <p className="font-semibold text-foreground group-hover:text-primary transition-colors duration-200 truncate">
          {title}
        </p>
        <p className="text-sm text-muted-foreground truncate">
          {description}
        </p>
      </div>
      <div className="text-xs text-muted-foreground whitespace-nowrap">
        {time}
      </div>
      {onClick && (
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
        </div>
      )}
    </div>
  )
}

export default function RecentActivity() {
  const [activities, setActivities] = useState<ActivityItemProps[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const profile = useSelector((state: RootState) => state.auth.user)
  const { notifications, fetchNotifications } = useNotifications()
  const { t } = useTranslation()
  const router = useRouter()

  useEffect(() => {
    fetchNotifications({ limit: 4 })
  }, [])

  useEffect(() => {
    const fetchRecentActivity = async () => {
      const userId = profile?._id
      if (!userId) return
      
      try {
        setLoading(true)
        setError(null)
        
        const combinedActivities: ActivityItemProps[] = []
        
        const recentNotifications = notifications.slice(0, 4).map(notification => ({
          icon: getNotificationIcon(notification.type),
          title: notification.title,
          description: notification.message,
          time: formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true }),
          iconColor: getNotificationIconColor(notification.type).iconColor,
          bgColor: getNotificationIconColor(notification.type).bgColor,
          onClick: () => handleNotificationClick(notification.type),
        }))
        
        combinedActivities.push(...recentNotifications)
        
        if (recentNotifications.length < 4) {
          try {
            const response = await activityApi.getActivities(userId)
            if (response.success && response.data) {
              const activityData = response.data.slice(0, 4 - recentNotifications.length).map((activity: Activity) => ({
                icon: getActivityIcon(activity.activity_name),
                title: activity.activity_name,
                description: activity.description,
                time: formatTimeAgo(activity.created_at),
                iconColor: getActivityIconColor(activity.activity_name).iconColor,
                bgColor: getActivityIconColor(activity.activity_name).bgColor,
              }))
              combinedActivities.push(...activityData)
            }
          } catch (activityError) {
            console.log("Regular activities not available, showing notifications only")
          }
        }
        
        setActivities(combinedActivities)
      } catch (error) {
        console.error("Failed to fetch recent activity:", error)
        setError(t('common.error'))
        setActivities([
          {
            icon: <Clock size={16} />,
            title: t('dashboard.recentActivity'),
            description: t('dashboard.recentActivity'),
            time: "--",
            iconColor: "text-gray-600",
            bgColor: "from-gray-100 to-gray-200",
          }
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchRecentActivity()
  }, [profile, notifications])

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'case_created':
      case 'case_status_changed':
        return <FileText size={16} />
      case 'document_uploaded':
        return <FileText size={16} />
      case 'chat_started':
        return <MessageSquare size={16} />
      case 'video_consultation_started':
        return <Video size={16} />
      case 'qa_question_posted':
      case 'qa_answer_posted':
        return <User size={16} />
      default:
        return <Bell size={16} />
    }
  }

  const getNotificationIconColor = (type: string) => {
    // Use the specified color scheme
    const colors = [
      "from-primary/10 to-accent/20",
      "from-blue-100 to-purple-100",
      "from-green-100 to-emerald-100", 
      "from-purple-100 to-pink-100"
    ];
    
    const iconColors = [
      "text-primary",
      "text-blue-500",
      "text-green-500",
      "text-purple-500"
    ];
    
    // Assign colors based on notification type
    switch (type) {
      case 'case_created':
      case 'case_status_changed':
        return { iconColor: iconColors[3], bgColor: colors[0] }
      case 'document_uploaded':
        return { iconColor: iconColors[2], bgColor: colors[1] }
      case 'chat_started':
        return { iconColor: iconColors[1], bgColor: colors[1] }
      case 'video_consultation_started':
        return { iconColor: iconColors[0], bgColor: colors[3] }
      case 'qa_question_posted':
      case 'qa_answer_posted':
        return { iconColor: iconColors[2], bgColor: colors[2] }
      default:
        return { iconColor: "text-gray-600", bgColor: "from-gray-100 to-gray-200" }
    }
  }

  const handleNotificationClick = (type: string) => {
    switch (type) {
      case 'chat_started':
        router.push('/chat')
        break
      case 'case_created':
      case 'case_status_changed':
        router.push('/cases')
        break
      case 'video_consultation_started':
        router.push('/video-consultations')
        break
      default:
        router.push('/notifications')
    }
  }

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
    // Use the specified color scheme
    const colors = [
      "from-primary/10 to-accent/20",
      "from-blue-100 to-purple-100",
      "from-green-100 to-emerald-100", 
      "from-purple-100 to-pink-100"
    ];
    
    const iconColors = [
      "text-primary",
      "text-blue-500",
      "text-green-500",
      "text-purple-500"
    ];
    
    const name = activityName.toLowerCase()
    if (name.includes('message') || name.includes('chat')) {
      return { iconColor: iconColors[1], bgColor: colors[1] }
    } else if (name.includes('video') || name.includes('call')) {
      return { iconColor: iconColors[0], bgColor: colors[0] }
    } else if (name.includes('document') || name.includes('file')) {
      return { iconColor: iconColors[2], bgColor: colors[2] }
    } else if (name.includes('appointment') || name.includes('meeting')) {
      return { iconColor: iconColors[3], bgColor: colors[3] }
    } else if (name.includes('user') || name.includes('profile')) {
      return { iconColor: iconColors[1], bgColor: colors[1] }
    } else {
      return { iconColor: "text-gray-600", bgColor: "from-gray-100 to-gray-200" }
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
    <Card className="card-korean h-[420px]">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-accent/20">
            <Bell className="w-5 h-5 text-primary" />
          </div>
          <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            {t('dashboard.recentActivity')}
          </span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="text-center py-6 text-red-500 bg-gradient-to-r from-red-100 to-red-200 p-3 rounded-lg">
            <p>{error}</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground bg-gradient-to-r from-gray-100 to-gray-200 p-4 rounded-lg">
            <Clock className="mx-auto h-10 w-10 mb-3 opacity-50" />
            <p className="text-sm">{t('dashboard.noRecentActivity')}</p>
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
              bgColor={activity.bgColor}
              onClick={activity.onClick}
            />
          ))
        )}
      </CardContent>
    </Card>
  )
}