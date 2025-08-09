"use client"
import type { Client } from "@/types/client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSelector } from "react-redux"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MessageSquare, Calendar, Loader2 } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { updateClientStatus, updateClientNotes } from "@/lib/api/clients-api"
import { createMeeting } from "@/lib/api/meeting-api"
import { useToast } from "@/hooks/use-toast"
import type { RootState } from "@/lib/store"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import ClientCases from "@/components/clients/client-cases"
import ClientDocuments from "@/components/clients/client-documents"
import ClientNotes from "@/components/clients/client-notes"
import { SimpleChat } from "@/components/chat/simple-chat"

interface ClientDetailsProps {
  client: Client
}

export default function ClientDetails({ client: initialClient }: ClientDetailsProps) {
  const [client, setClient] = useState<Client>(initialClient)
  const [meetingLink, setMeetingLink] = useState("")
  const [isSchedulingMeeting, setIsSchedulingMeeting] = useState(false)
  const [meetingDialogOpen, setMeetingDialogOpen] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const profile = useSelector((state: RootState) => state.auth.user)

  // Handle meeting scheduling
  const handleScheduleMeeting = async () => {
    if (!meetingLink.trim()) {
      toast({
        title: "Error",
        description: "Please enter a meeting link",
        variant: "destructive",
      })
      return
    }
    if (!profile?._id) {
      toast({
        title: "Error",
        description: "Please ensure you're logged in",
        variant: "destructive",
      })
      return
    }
    try {
      setIsSchedulingMeeting(true)
      const meetingData = {
        lawyerId: profile._id,
        clientId: client.id,
        meetingLink: meetingLink.trim(),
      }
      const response = await createMeeting(meetingData)
      if (response.success) {
        toast({
          title: "Success!",
          description: "Meeting scheduled successfully",
          variant: "default",
        })
        setMeetingLink("")
        setMeetingDialogOpen(false)
      } else {
        throw new Error(response.message || "Failed to schedule meeting")
      }
    } catch (error: any) {
      console.error("Meeting scheduling error:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to schedule meeting",
        variant: "destructive",
      })
    } finally {
      setIsSchedulingMeeting(false)
    }
  }

  // Handle create chat
  const [showChat, setShowChat] = useState(false)
  const handleCreateChat = () => {
    setShowChat(true)
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
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold">Client Details</h1>
        <Button variant="outline" onClick={() => router.back()}>
          Back to Client
        </Button>
      </div>
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={client.avatar || "/placeholder.svg?height=48&width=48"} alt={client.first_name} />
              <AvatarFallback>{client.first_name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-xl">{client.first_name}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                {getStatusBadge(client.status)}
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-2">
            {/* Action Buttons */}
            <Button variant="outline" onClick={handleCreateChat} title="Create Chat">
              <MessageSquare className="mr-2" size={16} />
              Chat
            </Button>
            {/* Schedule Meeting Button with Dialog */}
            <Dialog open={meetingDialogOpen} onOpenChange={setMeetingDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" title="Schedule Meeting">
                  <Calendar className="mr-2" size={16} />
                  Schedule Meeting
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Schedule Meeting</DialogTitle>
                  <DialogDescription>
                    Schedule a meeting with {client.first_name}. Please provide the meeting link.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="meetingLink">Meeting Link</Label>
                    <Input
                      id="meetingLink"
                      type="url"
                      placeholder="https://zoom.us/j/123456789 or https://meet.google.com/abc-defg-hij"
                      value={meetingLink}
                      onChange={(e) => setMeetingLink(e.target.value)}
                      disabled={isSchedulingMeeting}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setMeetingDialogOpen(false)}
                      disabled={isSchedulingMeeting}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleScheduleMeeting} disabled={!meetingLink.trim() || isSchedulingMeeting}>
                      {isSchedulingMeeting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Scheduling...
                        </>
                      ) : (
                        <>
                          <Calendar className="mr-2 h-4 w-4" />
                          Schedule Meeting
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
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
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>
            <TabsContent value="cases" className="mt-4">
              <ClientCases clientId={client.id} />
            </TabsContent>
            <TabsContent value="notes" className="mt-4">
              <ClientNotes clientId={client.id} notes={client.notes || ""} onSave={handleNotesUpdate} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      {/* Simple Chat Modal */}
      {showChat && (
        <SimpleChat
          onClose={() => setShowChat(false)}
          clientId={client.id}
          clientName={`${client.first_name} ${client.last_name}`}
          clientAvatar={client.avatar}
        />
      )}
    </div>
  )
}
