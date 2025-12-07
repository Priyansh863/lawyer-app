"use client"

import { useState } from "react"
import DashboardLayout from "@/components/layouts/dashboard-layout"
import LinkedDocumentsTable from "@/components/documents/linked-documents-table"
import { useTranslation } from "@/hooks/useTranslation"
import { HardDrive, Info } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function LinkedDocumentsPage() {
  const { t } = useTranslation()
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-lg">
              <HardDrive className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{t('linkedDocuments.title')}</h1>
              <p className="text-muted-foreground">
                {t('linkedDocuments.subtitle')}
              </p>
            </div>
          </div>

          {/* Info Alert */}
          <Alert className="bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-900">{t('linkedDocuments.documentTypes')}</AlertTitle>
            <AlertDescription className="text-blue-800">
              <strong>{t('linkedDocuments.uploaded')}:</strong> {t('linkedDocuments.uploadedDescription')} 
              <strong className="ml-2">{t('linkedDocuments.metadataOnly')}:</strong> {t('linkedDocuments.metadataOnlyDescription')}
            </AlertDescription>
          </Alert>
        </div>

        {/* Documents Table */}
        <LinkedDocumentsTable refreshTrigger={refreshTrigger} />
      </div>
    </DashboardLayout>
  )
}
