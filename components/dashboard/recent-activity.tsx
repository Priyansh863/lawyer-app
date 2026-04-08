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

interface ActivityLogItemProps {
  title: string
  category: string
  time: string
  type: 'client' | 'document' | 'consultation' | 'system'
}

function ActivityLogItem({ title, category, time, type }: ActivityLogItemProps) {
  const dotColors = {
    client: 'bg-red-500',
    document: 'bg-blue-500',
    consultation: 'bg-green-500',
    system: 'bg-gray-400'
  }

  return (
    <div className="flex items-center justify-between px-6 py-5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg shadow-sm hover:shadow-md transition-all group cursor-default">
      <div className="flex-1 min-w-0 pr-8">
        <span className="text-[14px] font-bold text-[#1E293B] dark:text-slate-100 group-hover:text-black dark:group-hover:text-white transition-colors truncate block">
          {title}
        </span>
      </div>

      <div className="flex items-center shrink-0">
        <div className="hidden lg:block text-right min-w-[200px] px-6">
          <span className="text-[13px] font-bold text-[#1E293B] dark:text-slate-200 opacity-80 tracking-tight">{category}</span>
        </div>

        <div className="text-right min-w-[200px] px-6">
          <span className="text-[12px] text-slate-400 font-bold tracking-tight">{time}</span>
        </div>

        <div className="flex-shrink-0 ml-6 pr-1">
          <div className={cn("w-2.5 h-2.5 rounded-full shadow-sm", dotColors[type])}></div>
        </div>
      </div>
    </div>
  )
}

interface RecentActivityProps {
  activities?: {
    type: 'client' | 'document' | 'consultation' | 'system'
    title: string
    user: string
    time: string
    category?: string
  }[]
}

export default function RecentActivity({ activities = [] }: RecentActivityProps) {
  const { t, language } = useTranslation()

  const getTranslatedTitle = (title: string) => {
    if (!title) return title;
    if (title === "New Q&A Question") return t('pages:recentActivity.events.newQA');
    if (title === "New Case Assigned") return t('pages:recentActivity.events.newCase');
    if (title === "Case Updated") return t('pages:recentActivity.events.updateCase');
    return title;
  };

  const getTranslatedCategory = (category: string) => {
    if (category === "Activity") return t('pages:recentActivity.categories.activity');
    return category;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-start gap-10">
        <h3 className="text-[#1E293B] dark:text-slate-100 font-bold text-2xl tracking-tight shrink-0">{t('pages:recentActivity.title')}</h3>
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
            <span className="text-[11px] text-[#1E293B] dark:text-slate-200 font-bold uppercase tracking-wider">{t('pages:recentActivity.client')}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
            <span className="text-[11px] text-[#1E293B] dark:text-slate-200 font-bold uppercase tracking-wider">{t('pages:recentActivity.caseDocument')}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
            <span className="text-[11px] text-[#1E293B] dark:text-slate-200 font-bold uppercase tracking-wider">{t('pages:recentActivity.appointmentsConsultations')}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-gray-400"></div>
            <span className="text-[11px] text-[#1E293B] dark:text-slate-200 font-bold uppercase tracking-wider">{t('pages:recentActivity.system')}</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {activities.length > 0 ? (
          activities.slice(0, 4).map((activity, index) => (
            <ActivityLogItem
              key={index}
              title={`${getTranslatedTitle(activity.title || (activity as any).activity_name)} – ${activity.user}`}
              category={getTranslatedCategory(activity.category || "Activity")}
              time={new Date(activity.time || (activity as any).createdAt || (activity as any).created_at).toLocaleDateString(language === 'ko' ? 'ko-KR' : 'en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
              type={activity.type || 'system'}
            />
          ))
        ) : (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-gray-200 dark:border-slate-700 shadow-sm">
            <p className="text-slate-400 text-sm font-bold tracking-tight">{t('pages:recentActivity.noActivities')}</p>
          </div>
        )}
      </div>
    </div>
  )
}
