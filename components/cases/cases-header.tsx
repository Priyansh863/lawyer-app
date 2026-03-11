"use client"
import { RootState } from "@/lib/store"
import { useSelector } from "react-redux"
import { getGreeting } from "@/lib/helpers/greeting"
import { useTranslation } from "@/hooks/useTranslation"
import CaseCreationForm from "./case-creation-form"

interface CasesHeaderProps {
  onCaseCreated?: () => void
}

export default function CasesHeader({ onCaseCreated }: CasesHeaderProps) {
  const { t } = useTranslation()
  return (
    <div className="mb-0">
      <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
        {t('pages:cases.title')}
      </h1>
    </div>
  )
}


