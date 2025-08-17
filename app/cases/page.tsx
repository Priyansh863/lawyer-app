"use client"
import React, { Suspense, useState, useCallback } from "react"
import CasesLayout from "@/components/layouts/cases-layout"
import CasesTable from "@/components/cases/cases-table"
import CasesHeader from "@/components/cases/cases-header"
import { getCases } from "@/lib/api/cases-api"
import { useTranslation } from "@/hooks/useTranslation"

export default function CasesPage() {
  const { t } = useTranslation()
  const [refreshKey, setRefreshKey] = useState(0)

  const handleCaseCreated = useCallback(() => {
    // Trigger a refresh of the cases table
    setRefreshKey(prev => prev + 1)
  }, [])

  return (
    <CasesLayout>
      <div className="flex flex-col gap-6">
        <CasesHeader onCaseCreated={handleCaseCreated} />
        <Suspense fallback={<div>{t('common.loading')}</div>}>
          <CasesTable key={refreshKey} initialCases={[]} />
        </Suspense>
      </div>
    </CasesLayout>
  )
}
