import axios from "axios"

export interface Notification {
  _id: string
  userId: string
  title: string
  message: string
  type: 'case_created' | 'case_status_changed' | 'document_uploaded' | 'chat_started' | 'video_consultation_started' | 'qa_question_posted' | 'qa_answer_posted' | 'general'
  relatedId?: string
  relatedType?: 'case' | 'document' | 'chat' | 'meeting' | 'qa_question' | 'qa_answer'
  redirectUrl?: string
  isRead: boolean
  priority: 'low' | 'medium' | 'high'
  metadata: any
  createdBy?: {
    _id: string
    first_name: string
    last_name: string
    account_type: string
  }
  createdAt: string
  updatedAt: string
}

export interface NotificationsResponse {
  success: boolean
  notifications: Notification[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  unreadCount: number
}

export interface UnreadCountResponse {
  success: boolean
  count: number
}

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'


export const notificationsApi = {



  getAuthHeaders() {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
    }
    return {
      'Content-Type': 'application/json'
    };
  },

  // Get notifications
  getNotifications: async (params?: {
    page?: number
    limit?: number
    unreadOnly?: boolean
  }): Promise<NotificationsResponse> => {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.unreadOnly) queryParams.append('unreadOnly', 'true')

    const response = await axios.get(`${API_BASE_URL}/notifications?${queryParams.toString()}`, {
      headers: notificationsApi.getAuthHeaders()
    })
    return response.data
  },

  // Get unread count
  getUnreadCount: async (): Promise<UnreadCountResponse> => {
    const response = await axios.get(`${API_BASE_URL}/notifications/unread-count`, {
      headers: notificationsApi.getAuthHeaders()
    })
    return response.data
  },

  // Mark notification as read
  markAsRead: async (notificationId: string): Promise<{ success: boolean; message: string }> => {
    const response = await axios.patch(`${API_BASE_URL}/notifications/${notificationId}/read`, {}, {
      headers: notificationsApi.getAuthHeaders()
    })
    return response.data
  },

  // Mark all notifications as read
  markAllAsRead: async (): Promise<{ success: boolean; message: string }> => {
    const response = await axios.patch(`${API_BASE_URL}/notifications/mark-all-read`, {}, {
      headers: notificationsApi.getAuthHeaders()
    })
    return response.data
  },

  // Delete notification
  deleteNotification: async (notificationId: string): Promise<{ success: boolean; message: string }> => {
    const response = await axios.delete(`${API_BASE_URL}/notifications/${notificationId}`, {
      headers: notificationsApi.getAuthHeaders()
    })
    return response.data
  },

  // Create notification (admin use)
  createNotification: async (data: {
    userId: string
    title: string
    message: string
    type: string
    relatedId?: string
    relatedType?: string
    redirectUrl?: string
    priority?: string
    metadata?: any
  }): Promise<{ success: boolean; notification: Notification; message: string }> => {
    const response = await axios.post(`${API_BASE_URL}/notifications`, data, {
      headers: notificationsApi.getAuthHeaders()
    })
    return response.data
  }
}
