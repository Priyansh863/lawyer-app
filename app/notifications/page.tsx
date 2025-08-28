'use client'

import React, { useState, useEffect } from 'react'
import { Bell, Check, CheckCheck, Trash2, Filter, RefreshCw } from 'lucide-react'
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

export default function NotificationsPage() {
  const { t } = useTranslation()
  const { 
    notifications, 
    unreadCount, 
    loading, 
    fetchNotifications, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
  } = useNotifications()
  
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const router = useRouter()

  useEffect(() => {
    fetchNotifications({ 
      page: 1, 
      limit: 20, 
      unreadOnly: filter === 'unread' 
    })
    setPage(1)
  }, [filter])

  const handleLoadMore = () => {
    const nextPage = page + 1
    fetchNotifications({ 
      page: nextPage, 
      limit: 20, 
      unreadOnly: filter === 'unread' 
    })
    setPage(nextPage)
  }

  const handleNotificationClick = async (notification: any) => {
    if (!notification.isRead) {
      await markAsRead(notification._id)
    }
    
    if (notification.type) {
      router.push(getNavigationUrl(notification.type))
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
      case 'qa_question_posted':
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
        return t('pages:notificationsa.types.videoCall')
      case 'qa_question_posted':
        return t('pages:notificationsa.types.qaQuestion')
      case 'qa_answer_posted':
        return t('pages:notificationsa.types.qaAnswer')
      default:
        return t('pages:notificationsa.types.general')
    }
  }

  const filteredNotifications = typeFilter === 'all' 
    ? notifications 
    : notifications.filter(n => n.type === typeFilter)

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bell className="h-6 w-6" />
          <h1 className="text-2xl font-bold">{t('pages:notificationsa.title')}</h1>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="rounded-full">
              {unreadCount} {t('pages:notificationsa.unread')}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchNotifications({ page: 1, limit: 20, unreadOnly: filter === 'unread' })}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {t('pages:notificationsa.refresh')}
          </Button>
          
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              {t('pages:notificationsa.markAllRead')}
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <Tabs value={filter} onValueChange={(value: any) => setFilter(value)} className="flex-1">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="all">{t('pages:notificationsa.allNotifications')}</TabsTrigger>
            <TabsTrigger value="unread">
              {t('pages:notificationsa.unread')} {unreadCount > 0 && `(${unreadCount})`}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder={t('pages:notificationsa.filterByType')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('pages:notificationsa.allTypes')}</SelectItem>
            <SelectItem value="case_created">{t('pages:notificationsa.types.caseCreated')}</SelectItem>
            <SelectItem value="case_status_changed">{t('pages:notificationsa.types.caseStatus')}</SelectItem>
            <SelectItem value="document_uploaded">{t('pages:notificationsa.types.document')}</SelectItem>
            <SelectItem value="chat_started">{t('pages:notificationsa.types.chat')}</SelectItem>
            <SelectItem value="video_consultation_started">{t('pages:notificationsa.types.videoCall')}</SelectItem>
            <SelectItem value="qa_question_posted">{t('pages:notificationsa.types.qaQuestion')}</SelectItem>
            <SelectItem value="qa_answer_posted">{t('pages:notificationsa.types.qaAnswer')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {loading && page === 1 ? (
          <div className="text-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
            <p className="text-muted-foreground">{t('pages:notificationsa.loading')}</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                {filter === 'unread' ? t('pages:notificationsa.noUnread') : t('pages:notificationsa.empty')}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredNotifications.map((notification) => (
            <Card
              key={notification._id}
              className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                !notification.isRead ? 'bg-blue-50 border-blue-200' : ''
              }`}
              onClick={() => handleNotificationClick(notification)}
            >
              <CardContent className="p-4">
                <div className={`border-l-4 pl-4 ${getPriorityColor(notification.priority)}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">{getTypeIcon(notification.type)}</span>
                        <Badge variant="outline" className="text-xs">
                          {getTypeLabel(notification.type)}
                        </Badge>
                        {notification.priority === 'high' && (
                          <Badge variant="destructive" className="text-xs">
                            {t('pages:notificationsa.highPriority')}
                          </Badge>
                        )}
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        )}
                      </div>
                      
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {notification.title}
                      </h3>
                      
                      <p className="text-sm text-gray-600 mb-2">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-400">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                          {notification.createdBy && (
                            <span className="ml-2">
                              {t('pages:notificationsa.by')} {notification.createdBy.first_name} {notification.createdBy.last_name}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      {!notification.isRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleMarkAsRead(notification._id, e)}
                          title={t('pages:notificationsa.markAsRead')}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleDeleteNotification(notification._id, e)}
                        title={t('pages:notificationsa.delete')}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {filteredNotifications.length > 0 && filteredNotifications.length % 20 === 0 && (
        <div className="text-center mt-6">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={loading}
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                {t('pages:notificationsa.loading')}
              </>
            ) : (
              t('pages:notificationsa.loadMore')
            )}
          </Button>
        </div>
      )}
    </div>
  )
}