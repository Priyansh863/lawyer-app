"use client"
import { useTranslation } from "@/hooks/useTranslation"

export default function CasesHeader() {
  const { t } = useTranslation()
  return (
    <div className="mb-0">
      <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
        {t('pages:cases.title')}
      </h1>
    </div>
  )
}


