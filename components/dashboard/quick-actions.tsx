"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Plus, Camera, Users, MessageSquare, Video, Sparkles, Zap } from "lucide-react";
import ScheduleMeetingModal from "@/components/modals/schedule-meeting-modal";
import SendMessageModal from "@/components/modals/send-message-modal";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/hooks/useTranslation";

interface ActionCardProps {
  icon: React.ReactNode
  title: string
  onClick: () => void
}

function ActionCard({ title, onClick }: ActionCardProps) {
  return (
    <Card
      className="bg-white border border-gray-200 shadow-sm rounded-xl h-31 flex flex-col justify-between p-6 hover:shadow-md transition-all cursor-pointer group w-full sm:w-[220px] flex-shrink-0"
      onClick={onClick}
    >
      <div className="flex-shrink-0">
        <Plus className="w-6 h-6 text-[#1E293B] group-hover:text-black transition-colors" />
      </div>
      <div className="flex justify-end">
        <span className="text-[#1E293B] font-bold text-[13px] tracking-tight">{title}</span>
      </div>
    </Card>
  )
}

export default function QuickActions() {
  const router = useRouter()
  const { t } = useTranslation()

  const actions = [
    { title: t('pages:quickActions.registerCase'), onClick: () => router.push("/cases?openModal=true") },
    { title: t('pages:quickActions.registerClient'), onClick: () => router.push("/client?openModal=true") },
    { title: t('pages:quickActions.uploadDocument'), onClick: () => router.push("/documents?openModal=true") },
    { title: t('pages:quickActions.posts'), onClick: () => router.push("/posts") },
  ]

  return (
    <div className="space-y-6">
      <h3 className="text-[#1E293B] font-bold text-2xl tracking-tight">{t('pages:quickActions.title')}</h3>
      <div className="flex flex-wrap gap-4">
        {actions.map((action, index) => (
          <ActionCard key={index} title={action.title} onClick={action.onClick} icon={<Plus />} />
        ))}
      </div>
    </div>
  )
}
