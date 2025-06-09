"use client"

import type { Client } from "@/types/client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star, Ban, MessageSquare, Phone, Video } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { updateClientStatus, toggleFavorite, toggleBlocked, updateClientNotes } from "@/lib/api/clients-api"
import { useToast } from "@/hooks/use-toast"
import ClientCases from "@/components/clients/client-cases"
import ClientDocuments from "@/components/clients/client-documents"
import ClientNotes from "@/components/clients/client-notes"

interface ClientDetailsProps {
  client: Client
}

export default function ClientDetails({ client: initialClient }: ClientDetailsProps) {
  const [client, setClient] = useState<Client>(initialClient)
  const router = useRouter()
  const { toast } = useToast()

  // Toggle favorite status
  const handleToggleFavorite = async () => {
    try {
      const updatedClient = await toggleFavorite(client.id, !client.isFavorite)
      setClient(updatedClient)

      toast({
        title: updatedClient.isFavorite ? "Added to favorites" : "Removed from favorites",
        description: `${updatedClient.name} has been ${
          updatedClient.isFavorite ? "added to" : "removed from"
        } favorites`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update favorite status",
        variant: "destructive",
      })
    }
  }

  // Toggle blocked status
  const handleToggleBlocked = async () => {
    try {
      const updatedClient = await toggleBlocked(client.id, !client.isBlocked)
      setClient(updatedClient)

      toast({
        title: updatedClient.isBlocked ? "Client blocked" : "Client unblocked",
        description: `${updatedClient.name} has been ${updatedClient.isBlocked ? "blocked" : "unblocked"}`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update blocked status",
        variant: "destructive",
      })
    }
  }

  // Update client status
  const handleStatusUpdate = async (status: "active" | "inactive" | "pending") => {
    try {
      const updatedClient = await updateClientStatus(client.id, status)
      setClient(updatedClient)

      toast({
        title: "Status updated",
        description: `Client status has been updated to ${status}`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update client status",
        variant: "destructive",
      })
    }
  }

  // Handle notes update
  const handleNotesUpdate = async (notes: string) => {
    try {
      const updatedClient = await updateClientNotes(client.id, notes)
      setClient(updatedClient)

      toast({
        title: "Notes updated",
        description: "Client notes have been updated",
      })

      return true
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update client notes",
        variant: "destructive",
      })

      return false
    }
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-600 border-yellow-200">
            Pending
          </Badge>
        )
      case "active":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
            Active
          </Badge>
        )
      case "inactive":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
            Inactive
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Client Details</h1>
        <Button variant="outline" onClick={() => router.back()}>
          Back to Clients
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center space-x-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={client.avatar || "/placeholder.svg?height=48&width=48"} alt={client.name} />
              <AvatarFallback>{client.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-xl">{client.name}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                {getStatusBadge(client.status)}
                {client.isBlocked && (
                  <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
                    Blocked
                  </Badge>
                )}
                {client.isFavorite && (
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-600 border-yellow-200">
                    Favorite
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleToggleFavorite}
              className={client.isFavorite ? "text-yellow-500" : ""}
              title={client.isFavorite ? "Remove from Favorites" : "Add to Favorites"}
            >
              <Star className={client.isFavorite ? "fill-yellow-500" : ""} size={16} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleToggleBlocked}
              className={client.isBlocked ? "text-red-500" : ""}
              title={client.isBlocked ? "Unblock Client" : "Block Client"}
            >
              <Ban size={16} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push(`/chat?clientId=${client.id}`)}
              title="Send Message"
            >
              <MessageSquare size={16} />
            </Button>
            <Button variant="outline" size="icon" onClick={() => {}} title="Call Client">
              <Phone size={16} />
            </Button>
            <Button variant="outline" size="icon" onClick={() => {}} title="Video Call">
              <Video size={16} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Email</h3>
              <p className="text-base">{client.email}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Phone</h3>
              <p className="text-base">{client.phone}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Address</h3>
              <p className="text-base">{client.address}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Client Since</h3>
              <p className="text-base">{formatDate(client.createdAt)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Last Contact</h3>
              <p className="text-base">{formatDate(client.lastContactDate)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Active Cases</h3>
              <p className="text-base">{client.activeCases}</p>
            </div>
          </div>

          <Tabs defaultValue="cases" className="mt-6">
            <TabsList>
              <TabsTrigger value="cases">Cases</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>
            <TabsContent value="cases" className="mt-4">
              <ClientCases clientId={client.id} />
            </TabsContent>
            <TabsContent value="documents" className="mt-4">
              <ClientDocuments clientId={client.id} />
            </TabsContent>
            <TabsContent value="notes" className="mt-4">
              <ClientNotes clientId={client.id} notes={client.notes || ""} onSave={handleNotesUpdate} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
