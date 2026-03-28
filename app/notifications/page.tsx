'use client'

import React, { useState, useEffect } from 'react'
import { Bell, Check, CheckCheck, Trash2, Filter, RefreshCw, ArrowLeft } from 'lucide-react'
import { useNotifications } from '../../contexts/NotificationContext'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import { useTranslation } from '@/hooks/useTranslation'
import { cn } from '@/lib/utils'

export default function NotificationsPage() {
  const { t, language } = useTranslation()
  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotifications()

  const [page, setPage] = useState(1)
  const router = useRouter()

  const handleBack = () => {
    router.back()
  }

  const handleNotificationClick = async (notification: any) => {
    if (!notification.isRead) {
      await markAsRead(notification._id)
    }

    // Prioritize known types and our internal mapping
    const navUrl = notification.type ? getNavigationUrl(notification.type) : null
    
    if (notification.type === "qa_answer_posted" || notification.type === "qa_question_posted") {
      router.push("/qa")
    } else if (navUrl && navUrl !== "/notifications") {
      // If we have a specific mapping and it's not the fallback, use it
      router.push(navUrl)
    } else if (notification.redirectUrl) {
      // Sanitize redirect URL – common mistake is underscores vs hyphens
      const sanitizedUrl = notification.redirectUrl.replace(/_/g, '-')
      router.push(sanitizedUrl)
    } else if (notification.type) {
      router.push(getNavigationUrl(notification.type))
    }
  }

  const getNavigationUrl = (type: string) => {
    switch (type) {
      case 'chat_started':
      case 'chat_message':
        return '/chat'
      case 'case_created':
      case 'case_status_changed':
        return '/cases'
      case 'video_consultation_started':
      case 'video_consultation_scheduled':
      case 'video_consultation':
      case 'meeting_created':
      case 'meeting_scheduled':
      case 'meeting_started':
      case 'meeting':
        return '/video-consultations'
      case 'qa_question_posted':
      case 'qa_answer_posted':
        return '/qa'
      case 'document_uploaded':
        return '/documents'
      default:
        return '/notifications'
    }
  }

  const handleDeleteNotification = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    await deleteNotification(notificationId)
  }

  const handleMarkAsRead = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    await markAsRead(notificationId)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500 bg-red-50'
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50'
      case 'low':
        return 'border-l-green-500 bg-green-50'
      default:
        return 'border-l-gray-500 bg-gray-50'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'case_created':
      case 'case_status_changed':
        return '⚖️'
      case 'document_uploaded':
        return '📄'
      case 'chat_started':
        return '💬'
      case 'video_consultation_started':
      case 'video_consultation_scheduled':
      case 'video_consultation':
        return '🎥'
      case 'qa_question_posted':
      case 'qa_answer_posted':
        return '❓'
      default:
        return '🔔'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'case_created':
        return t('pages:notificationsa.types.caseCreated')
      case 'case_status_changed':
        return t('pages:notificationsa.types.caseStatus')
      case 'document_uploaded':
        return t('pages:notificationsa.types.document')
      case 'chat_started':
        return t('pages:notificationsa.types.chat')
      case 'video_consultation_started':
      case 'video_consultation_scheduled':
      case 'video_consultation':
        return t('pages:notificationsa.types.videoCall')
      case 'qa_question_posted':
        return t('pages:notificationsa.types.qaQuestion')
      case 'qa_answer_posted':
        return t('pages:notificationsa.types.qaAnswer')
      default:
        return t('pages:notificationsa.types.general')
    }
  }

  // Helper function to get notification title based on current language
  const getNotificationTitle = (notification: any) => {
    if (language === 'ko' && notification.titleKo) {
      return notification.titleKo
    }
    return notification.title
  }

  // Helper function to get notification message based on current language
  const getNotificationMessage = (notification: any) => {
    if (language === 'ko' && notification.messageKo) {
      return notification.messageKo
    }
    return notification.message
  }

  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<'unread' | 'read'>('unread')

  useEffect(() => {
    fetchNotifications({
      page: 1,
      limit: 50, // Fetch more to allow client-side filtering if needed or just use current API
      unreadOnly: activeTab === 'unread'
    })
    setPage(1)
    setSelectedIds([])
  }, [activeTab])

  const handleLoadMore = () => {
    const nextPage = page + 1
    fetchNotifications({
      page: nextPage,
      limit: 50,
      unreadOnly: activeTab === 'unread'
    })
    setPage(nextPage)
  }

  const handleRefresh = () => {
    fetchNotifications({
      page: 1,
      limit: 50,
      unreadOnly: activeTab === 'unread'
    })
    setPage(1)
    setSelectedIds([])
    toast.success(t('pages:notificationsa.toasts.refreshed'))
  }

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return

    try {
      await Promise.all(selectedIds.map(id => deleteNotification(id)))
      setSelectedIds([])
      toast.success(t('pages:notificationsa.toasts.deleted'))
    } catch (error) {
      toast.error(t('pages:notificationsa.toasts.deleteFailed'))
    }
  }

  const handleMarkSelectedAsRead = async () => {
    if (selectedIds.length === 0) return

    try {
      await Promise.all(selectedIds.map(id => markAsRead(id)))
      setSelectedIds([])
      toast.success(t('pages:notificationsa.toasts.markedRead'))
    } catch (error) {
      toast.error(t('pages:notificationsa.toasts.markReadFailed'))
    }
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === notifications.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(notifications.map(n => n._id))
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const getEventLabel = (type: string) => {
    switch (type) {
      case 'video_consultation_started':
      case 'video_consultation_scheduled':
      case 'video_consultation':
      case 'meeting_created':
      case 'meeting_scheduled':
      case 'meeting_started':
        return t('pages:notificationsa.eventLabels.videoConsultation')
      case 'case_created':
        return t('pages:notificationsa.eventLabels.caseCreated')
      case 'chat_message':
      case 'chat_started':
        return t('pages:notificationsa.eventLabels.messageReceived')
      case 'document_uploaded':
        return t('pages:notificationsa.eventLabels.documentUploaded')
      case 'payment_completed':
        return t('pages:notificationsa.eventLabels.paymentCompleted')
      case 'appointment_changed':
        return t('pages:notificationsa.eventLabels.appointmentChanged')
      default:
        return t('pages:notificationsa.eventLabels.notification')
    }
  }

  const formatNotificationTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString(language === 'ko' ? 'ko-KR' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).replace(',', ' —')
  }

  return (
    <div className="flex flex-col space-y-6 max-w-[1400px]">
      {/* Header Section */}
      <div className="flex justify-between items-center bg-transparent py-2">
        <h1 className="text-[28px] font-bold text-[#0F172A] font-serif">{t('pages:notificationsa.title')}</h1>
      </div>

      {/* Tabs and Actions Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200">
        <div className="flex items-center gap-8">
          <button
            onClick={() => setActiveTab('unread')}
            className={cn(
              "relative pb-3 text-[15px] font-bold transition-all whitespace-nowrap",
              activeTab === 'unread'
                ? "text-[#0F172A] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#0F172A]"
                : "text-slate-400 hover:text-slate-600"
            )}
          >
            {t('pages:notificationsa.unreadNotifications')}
          </button>
          <button
            onClick={() => setActiveTab('read')}
            className={cn(
              "relative pb-3 text-[15px] font-bold transition-all whitespace-nowrap",
              activeTab === 'read'
                ? "text-[#0F172A] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#0F172A]"
                : "text-slate-400 hover:text-slate-600"
            )}
          >
            {t('pages:notificationsa.readNotifications')}
          </button>
        </div>

        <div className="flex items-center gap-3 pb-3">
          <Button
            variant="outline"
            onClick={handleDeleteSelected}
            disabled={selectedIds.length === 0}
            className="border-slate-800 text-[#0F172A] font-bold h-10 px-8 rounded-md text-[13px] hover:bg-slate-50"
          >
            {t('pages:notificationsa.deleteAction')}
          </Button>
          <Button
            variant="outline"
            onClick={handleMarkSelectedAsRead}
            disabled={selectedIds.length === 0 || activeTab === 'read'}
            className="border-slate-800 text-[#0F172A] font-bold h-10 px-6 rounded-md text-[13px] hover:bg-slate-50"
          >
            {t('pages:notificationsa.markAsReadAction')}
          </Button>
          <Button
            onClick={handleRefresh}
            disabled={loading}
            className="bg-[#0F172A] hover:bg-[#1E293B] text-white font-bold h-10 px-10 rounded-md text-[13px] transition-all"
          >
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : t('pages:notificationsa.refreshAction')}
          </Button>
        </div>
      </div>

      {/* Notifications Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#fcfdfe] border-b border-slate-200">
              <th className="py-4 px-4 w-12">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={notifications.length > 0 && selectedIds.length === notifications.length}
                    onChange={toggleSelectAll}
                    style={{ accentColor: '#0F172A' }}
                    className="h-4 w-4 rounded border-slate-300 cursor-pointer"
                  />
                </div>
              </th>
              <th className="py-4 px-4 text-[#64748b] font-bold text-[11px] uppercase tracking-[0.1em]">{t('pages:notificationsa.tableEvent')}</th>
              <th className="py-4 px-4 text-[#64748b] font-bold text-[11px] uppercase tracking-[0.1em]">{t('pages:notificationsa.tableDetails')}</th>
              <th className="py-4 px-4 text-[#64748b] font-bold text-[11px] uppercase tracking-[0.1em] text-right">{t('pages:notificationsa.tableTime')}</th>
              <th className="py-4 px-4 text-[#64748b] font-bold text-[11px] uppercase tracking-[0.1em] text-center w-24">{t('pages:notificationsa.tableAction')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && notifications.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-500">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                  {t('pages:notificationsa.loadingNotifications')}
                </td>
              </tr>
            ) : notifications.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-500">
                  {t('pages:notificationsa.noNotificationsFound')}
                </td>
              </tr>
            ) : (
              notifications.map((notification) => (
                <tr
                  key={notification._id}
                  className={cn(
                    "hover:bg-slate-50 transition-colors cursor-pointer",
                    selectedIds.includes(notification._id) ? "bg-slate-50" : ""
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(notification._id)}
                        onChange={() => toggleSelect(notification._id)}
                        style={{ accentColor: '#0F172A' }}
                        className="h-4 w-4 rounded border-slate-300 cursor-pointer"
                      />
                    </div>
                  </td>
                  <td className="py-4 px-4 font-bold text-[14px] text-[#0F172A]">
                    {getEventLabel(notification.type)}
                  </td>
                  <td className="py-4 px-4 text-[14px] text-slate-600">
                    {getNotificationMessage(notification)}
                  </td>
                  <td className="py-4 px-4 text-[13px] text-slate-500 font-medium text-right">
                    {formatNotificationTime(notification.createdAt)}
                  </td>
                  <td className="py-4 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => handleDeleteNotification(notification._id, e)}
                      className="text-red-500 hover:text-red-600 transition-colors p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {notifications.length > 0 && notifications.length % 50 === 0 && (
        <div className="text-center mt-6">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={loading}
            className="border-slate-300 text-[#0F172A] font-bold h-10 px-8 rounded-md text-[13px]"
          >
            {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
            {t('pages:notificationsa.loadMoreAction')}
          </Button>
        </div>
      )}
    </div>
  )
}
