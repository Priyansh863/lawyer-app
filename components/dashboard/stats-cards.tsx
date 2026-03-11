"use client"
import React from "react"
import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { FileText, FileArchive, DollarSign, MessageSquare, Users, Home, Coins } from "lucide-react"
import { activityApi, type DashboardSummary } from "@/lib/api/activity-api"
import { useSelector } from "react-redux"
import type { RootState } from "@/lib/store"
import { useTranslation } from "@/hooks/useTranslation"
import axios from "axios"

interface StatCardProps {
  title: string
  value: string | number
}

function StatCard({ title, value }: StatCardProps) {
  return (
    <Card className="bg-white border border-gray-200 shadow-sm rounded-xl h-32 flex flex-col justify-between p-5 hover:shadow-md transition-shadow">
      <div className="text-[#1E293B] font-bold text-sm tracking-tight">{title}</div>
      <div className="flex justify-end">
        <span className="text-5xl font-bold text-[#1E293B] tracking-tighter">{value}</span>
      </div>
    </Card>
  )
}

interface StatsCardsProps {
  data?: {
    ongoingCases: number
    todayConsultations: number
    unreadNotifications: number
    unreviewedDocuments: number
  }
}

function StatsCards({ data }: StatsCardsProps) {
  const { t } = useTranslation()

  const items = [
    { title: t('pages:statsCards.ongoingCases'), value: data?.ongoingCases ?? 0 },
    { title: t('pages:statsCards.todayConsultations'), value: data?.todayConsultations ?? 0 },
    { title: t('pages:statsCards.unreadNotifications'), value: data?.unreadNotifications ?? 0 },
    { title: t('pages:statsCards.unreviewedDocuments'), value: data?.unreviewedDocuments ?? 0 },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-[1200px]">
      {items.map((item, index) => (
        <StatCard key={index} title={item.title} value={item.value} />
      ))}
    </div>
  )
}

export default React.memo(StatsCards)
