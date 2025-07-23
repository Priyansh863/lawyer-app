"use client"
import React, { Suspense } from "react"
import ClientLayout from "@/components/layouts/client-layout"
import ClientsTable from "@/components/clients/clients-table"
import ClientsHeader from "@/components/clients/clients-header"
import { Loader2 } from "lucide-react"
import { useTranslation } from "@/hooks/useTranslation"

function ClientContent() {
  return (
    <div className="flex flex-col gap-6">
      <ClientsHeader />
      <ClientsTable initialClients={[]} />
    </div>
  )
}

export default function ClientPage() {
  const { t } = useTranslation()
  
  return (
    <ClientLayout>
      <Suspense fallback={
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">{t('common.loading')}</span>
        </div>
      }>
        <ClientContent />
      </Suspense>
    </ClientLayout>
  )
}
