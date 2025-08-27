'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'
import { useNotifications } from '../contexts/NotificationContext'
import { Notification } from '../lib/api/notifications-api'

export const useNotificationToasts = () => {
  const { notifications, refreshUnreadCount } = useNotifications()

  useEffect(() => {
    // Listen for new notifications and show toast
    const showNotificationToast = (notification: Notification) => {
      const getToastIcon = (type: string) => {
        switch (type) {
          case 'case_created':
          case 'case_status_changed':
            return '⚖️'
          case 'document_uploaded':
            return '📄'
          case 'chat_started':
            return '💬'
          case 'video_consultation_started':
            return '🎥'
          case 'qa_question_posted':
          case 'qa_answer_posted':
            return '❓'
          default:
            return '🔔'
        }
      }

      const toastOptions = {
        duration: notification.priority === 'high' ? 8000 : 5000,
        action: notification.redirectUrl ? {
          label: 'View',
          onClick: () => {
            window.location.href = notification.redirectUrl!
          }
        } : undefined
      }

      switch (notification.priority) {
        case 'high':
          toast.error(`${getToastIcon(notification.type)} ${notification.title}`, {
            description: notification.message,
            ...toastOptions
          })
          break
        case 'medium':
          toast.info(`${getToastIcon(notification.type)} ${notification.title}`, {
            description: notification.message,
            ...toastOptions
          })
          break
        case 'low':
          toast.success(`${getToastIcon(notification.type)} ${notification.title}`, {
            description: notification.message,
            ...toastOptions
          })
          break
        default:
          toast(`${getToastIcon(notification.type)} ${notification.title}`, {
            description: notification.message,
            ...toastOptions
          })
      }
    }

    // Check for new notifications periodically
    const checkForNewNotifications = () => {
      refreshUnreadCount()
      
      // You can implement WebSocket or Server-Sent Events here for real-time notifications
      // For now, we'll use polling as a fallback
    }

    // Set up polling for new notifications every 30 seconds
    const interval = setInterval(checkForNewNotifications, 30000)

    return () => clearInterval(interval)
  }, [notifications, refreshUnreadCount])
}

// WebSocket hook for real-time notifications (optional enhancement)
export const useRealtimeNotifications = () => {
  const { refreshUnreadCount, fetchNotifications } = useNotifications()

  useEffect(() => {
    // Implement WebSocket connection for real-time notifications
    // This would connect to your backend WebSocket server
    
    /*
    const ws = new WebSocket('ws://your-backend-url/notifications')
    
    ws.onmessage = (event) => {
      const notification = JSON.parse(event.data)
      
      // Show toast notification
      toast.info(`🔔 ${notification.title}`, {
        description: notification.message,
        action: notification.redirectUrl ? {
          label: 'View',
          onClick: () => window.location.href = notification.redirectUrl
        } : undefined
      })
      
      // Refresh notifications
      refreshUnreadCount()
      fetchNotifications({ limit: 10 })
    }
    
    return () => ws.close()
    */
  }, [refreshUnreadCount, fetchNotifications])
}
