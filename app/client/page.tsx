import React, { Suspense } from "react"
import ClientLayout from "@/components/layouts/client-layout"
import ClientsTable from "@/components/clients/clients-table"
import ClientsHeader from "@/components/clients/clients-header"
import { getClients } from "@/lib/api/clients-api"

export default async function ClientPage() {
  const clients = await getClients({ status: "all" })

  return (
    <ClientLayout>
      <div className="flex flex-col gap-6">
        <ClientsHeader />
        <Suspense fallback={<div>Loading clients...</div>}>
          <ClientsTable initialClients={clients} />
        </Suspense>
      </div>
    </ClientLayout>
  )
}
