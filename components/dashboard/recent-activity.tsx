"use client"
import React, { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare, Video, FileText, Calendar, Clock, User, Bell } from "lucide-react"
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
  onClick?: () => void
  isNotification?: boolean
}

function ActivityItem({ icon, title, description, time, iconColor = "bg-gray-100", onClick, isNotification = false }: ActivityItemProps) {
  return (
    <div 
      className={`flex items-start gap-4 py-3 ${onClick ? 'cursor-pointer hover:bg-gray-50 rounded-lg px-2 -mx-2' : ''} ${isNotification ? 'bg-blue-50 border-l-2 border-blue-500 pl-4' : ''}`}
      onClick={onClick}
    >
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
  const { notifications, fetchNotifications } = useNotifications()
  const { t } = useTranslation()
  const router = useRouter()

  useEffect(() => {
    // Fetch notifications for recent activity
    fetchNotifications({ limit: 4 })
  }, [])

  useEffect(() => {
    const fetchRecentActivity = async () => {
      const userId = profile?._id
      if (!userId) return
      
      try {
        setLoading(true)
        setError(null)
        
        // Combine notifications with regular activities
        const combinedActivities: ActivityItemProps[] = []
        
        // Add last 4 notifications
        const recentNotifications = notifications.slice(0, 4).map(notification => ({
          icon: getNotificationIcon(notification.type),
          title: notification.title,
          description: notification.message,
          time: formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true }),
          iconColor: getNotificationIconColor(notification.type),
          onClick: () => handleNotificationClick(notification.type),
          isNotification: true
        }))
        
        combinedActivities.push(...recentNotifications)
        
        // If we have less than 4 notifications, try to fetch regular activities
        if (recentNotifications.length < 4) {
          try {
            const response = await activityApi.getActivities(userId)
            if (response.success && response.data) {
              const activityData = response.data.slice(0, 4 - recentNotifications.length).map((activity: Activity) => ({
                icon: getActivityIcon(activity.activity_name),
                title: activity.activity_name,
                description: activity.description,
                time: formatTimeAgo(activity.created_at),
                iconColor: getActivityIconColor(activity.activity_name),
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
            iconColor: "bg-gray-100 text-gray-600",
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
    switch (type) {
      case 'case_created':
      case 'case_status_changed':
        return "bg-purple-100 text-purple-600"
      case 'document_uploaded':
        return "bg-green-100 text-green-600"
      case 'chat_started':
        return "bg-blue-100 text-blue-600"
      case 'video_consultation_started':
        return "bg-red-100 text-red-600"
      case 'qa_question_posted':
      case 'qa_answer_posted':
        return "bg-yellow-100 text-yellow-600"
      default:
        return "bg-gray-100 text-gray-600"
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
        <CardTitle className="flex items-center gap-2">
          {t('dashboard.recentActivity')}
          <Bell size={16} className="text-blue-600" />
        </CardTitle>
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
            <p>{t('dashboard.recentActivity')}</p>
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
              onClick={activity.onClick}
              isNotification={activity.isNotification}
            />
          ))
        )}
      </CardContent>
    </Card>
  )
  
}
