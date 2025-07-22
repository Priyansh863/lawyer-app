import { notFound } from "next/navigation"
import ClientLayout from "@/components/layouts/client-layout"
import ClientDetails from "@/components/clients/client-details"
import type { Client } from "@/types/client"

interface ClientPageProps {
  params: {
    id: string
  }
  searchParams: {
    data?: string
  }
}

export default async function ClientDetailPage({ params, searchParams }: ClientPageProps) {
  let clientData: Client | null = null
  
  if (searchParams.data) {
    try {
      clientData = JSON.parse(decodeURIComponent(searchParams.data)) as Client
    } catch (error) {
      console.error("Failed to parse client data from URL:", error)
    }
  }
  
  if (!clientData) {
    notFound()
  }

  return (
    <ClientLayout>
      <ClientDetails client={clientData} />
    </ClientLayout>
  )
}
