'use client'

import { useNotificationToasts } from '@/hooks/useNotificationToasts'

export default function NotificationToastProvider() {
  useNotificationToasts()
  return null
}
