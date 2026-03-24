"use client"

import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useSelector } from "react-redux"
import { useTranslation } from "@/hooks/useTranslation"

export default function QAHeader() {
  const router = useRouter()
  const { t } = useTranslation()
  const user = useSelector((state: any) => state.auth.user)
  const isClient = user?.account_type === "client"


  return (
    <div className="mb-8 space-y-1 flex items-start justify-between gap-4">
      <div className="space-y-1">
        <h1 className="text-[#1E293B] font-bold text-3xl tracking-tight">
          {t('pages:qa.title')}
        </h1>
        <p className="text-sm text-slate-500">
          {t('pages:qa.description')}
        </p>
      </div>

      {isClient && (
        <Button
          onClick={() => router.push("/qa/new/form")}
          className="bg-[#1E293B] hover:bg-[#0F172A] text-white gap-2 rounded-xl font-bold h-11 px-5"
        >
          <PlusCircle size={18} />
          {t("pages:askQuestion")}
        </Button>
      )}
    </div>
  )
}
