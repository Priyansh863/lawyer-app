import { notFound } from "next/navigation"
import ClientLayout from "@/components/layouts/client-layout"
import ClientDetails from "@/components/clients/client-details"
import type { Client } from "@/types/client"

interface ClientPageProps {
  params: Promise<{
    id: string
  }>
  searchParams: Promise<{
    data?: string
  }>
}

export default async function ClientDetailPage({ params, searchParams }: ClientPageProps) {
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams
  let clientData: Client | null = null
  
  if (resolvedSearchParams.data) {
    try {
      clientData = JSON.parse(decodeURIComponent(resolvedSearchParams.data)) as Client
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
