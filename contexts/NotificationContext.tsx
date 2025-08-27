'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react'
import { notificationsApi, Notification } from '../lib/api/notifications-api'
import { toast } from 'sonner'
import { useRouter, usePathname } from 'next/navigation'

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  fetchNotifications: (params?: { page?: number; limit?: number; unreadOnly?: boolean }) => Promise<void>
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (notificationId: string) => Promise<void>
  refreshUnreadCount: () => Promise<void>
  checkForNewNotifications: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

interface NotificationProviderProps {
  children: ReactNode
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [lastNotificationCount, setLastNotificationCount] = useState(0)
  const pathname = usePathname()
  const router = useRouter()
  const previousPathnameRef = useRef(pathname)
  const isInitialLoadRef = useRef(true)

  const fetchNotifications = async (params?: { page?: number; limit?: number; unreadOnly?: boolean }) => {
    try {
      setLoading(true)
      const response = await notificationsApi.getNotifications(params)
      
      if (params?.page && params.page > 1) {
        setNotifications(prev => [...prev, ...response.notifications])
      } else {
        setNotifications(response.notifications)
      }
      
      setUnreadCount(response.unreadCount)
    } catch (error) {
      console.error('Error fetching notifications:', error)
      toast.error('Failed to fetch notifications')
    } finally {
      setLoading(false)
    }
  }

  const refreshUnreadCount = async () => {
    try {
      const response = await notificationsApi.getUnreadCount()
      setUnreadCount(response.count)
    } catch (error) {
      console.error('Error fetching unread count:', error)
    }
  }

  const checkForNewNotifications = async () => {
    try {
      const response = await notificationsApi.getNotifications({ page: 1, limit: 5 })
      const newCount = response.unreadCount
      
      // Check if there are new notifications since last check
      if (!isInitialLoadRef.current && newCount > lastNotificationCount) {
        const latestUnreadNotification = response.notifications.find(n => !n.isRead)
        
        // Show toast only for the latest notification
        if (latestUnreadNotification) {
          const getNotificationIcon = (type: string) => {
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

          const getNavigationUrl = (type: string) => {
            switch (type) {
              case 'chat_started':
                return '/chat'
              case 'case_created':
              case 'case_status_changed':
                return '/cases'
              case 'video_consultation_started':
                return '/video-consultations'
              default:
                return latestUnreadNotification.redirectUrl || '/notifications'
            }
          }

          toast.success(`${getNotificationIcon(latestUnreadNotification.type)} ${latestUnreadNotification.title}`, {
            description: latestUnreadNotification.message,
            duration: 5000,
            action: {
              label: 'View',
              onClick: () => {
                router.push(getNavigationUrl(latestUnreadNotification.type))
              }
            }
          })
        }
      }
      
      setUnreadCount(newCount)
      setLastNotificationCount(newCount)
      
      if (isInitialLoadRef.current) {
        isInitialLoadRef.current = false
        setLastNotificationCount(newCount)
      }
      
    } catch (error) {
      console.error('Error checking for new notifications:', error)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      await notificationsApi.markAsRead(notificationId)
      
      setNotifications(prev => 
        prev.map(notification => 
          notification._id === notificationId 
            ? { ...notification, isRead: true }
            : notification
        )
      )
      
      setUnreadCount(prev => Math.max(0, prev - 1))
      setLastNotificationCount(prev => Math.max(0, prev - 1))
      
    } catch (error) {
      console.error('Error marking notification as read:', error)
      toast.error('Failed to mark notification as read')
    }
  }

  const markAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead()
      
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, isRead: true }))
      )
      
      setUnreadCount(0)
      setLastNotificationCount(0)
      // Removed toast message for mark all as read
      
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      toast.error('Failed to mark all notifications as read')
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      await notificationsApi.deleteNotification(notificationId)
      
      const deletedNotification = notifications.find(n => n._id === notificationId)
      setNotifications(prev => prev.filter(notification => notification._id !== notificationId))
      
      if (deletedNotification && !deletedNotification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1))
        setLastNotificationCount(prev => Math.max(0, prev - 1))
      }
      
      toast.success('Notification deleted')
      
    } catch (error) {
      console.error('Error deleting notification:', error)
      toast.error('Failed to delete notification')
    }
  }

  // Only check on tab/route changes
  useEffect(() => {
    if (previousPathnameRef.current !== pathname) {
      checkForNewNotifications()
      previousPathnameRef.current = pathname
    }
  }, [pathname])

  // Initial load only
  useEffect(() => {
    checkForNewNotifications()
  }, [])

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshUnreadCount,
    checkForNewNotifications
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}
