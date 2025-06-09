import { notFound } from "next/navigation"
import ClientLayout from "@/components/layouts/client-layout"
import ClientDetails from "@/components/clients/client-details"
import { getClientById } from "@/lib/api/clients-api"

interface ClientPageProps {
  params: {
    id: string
  }
}

export default async function ClientDetailPage({ params }: ClientPageProps) {
  const client = await getClientById(params.id)

  if (!client) {
    notFound()
  }

  return (
    <ClientLayout>
      <ClientDetails client={client} />
    </ClientLayout>
  )
}
