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
  const user = useSelector((state: RootState) => state.auth.user)
  const { t } = useTranslation()

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">
          {t('pages:cases.title')}
        </h1>
        <p className="text-muted-foreground">
          Manage and track your legal cases
        </p>
      </div>
      
      {/* Only show create button for lawyers */}
      {user?.account_type === 'lawyer' && (
        <CaseCreationForm onCaseCreated={onCaseCreated} />
      )}
    </div>
  )
}


