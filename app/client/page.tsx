"use client"
import React, { Suspense, useState } from "react"
import ClientLayout from "@/components/layouts/client-layout"
import ClientsTable from "@/components/clients/clients-table"
import ClientsHeader from "@/components/clients/clients-header"
import { Loader2 } from "lucide-react"
import { useTranslation } from "@/hooks/useTranslation"

function ClientContent() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleClientCreated = () => {
    // Force refresh of the clients table by updating the key
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="flex flex-col gap-6">
      <ClientsHeader onClientCreated={handleClientCreated} />
      <ClientsTable key={refreshKey} initialClients={[]} />
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
