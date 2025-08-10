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
import { MessageSquare,HelpCircle, Calendar, Loader2 } from "lucide-react"
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
import ClientNotes from "@/components/clients/client-notes"
import { SimpleChat } from "@/components/chat/simple-chat"
import { useTranslation } from "@/hooks/useTranslation"

interface ClientDetailsProps {
  client: Client
}

export default function ClientDetails({ client: initialClient }: ClientDetailsProps) {
  const { t } = useTranslation()
  const [client, setClient] = useState<Client>(initialClient)
  const [meetingLink, setMeetingLink] = useState("")
  const [isSchedulingMeeting, setIsSchedulingMeeting] = useState(false)
  const [meetingDialogOpen, setMeetingDialogOpen] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const profile = useSelector((state: RootState) => state.auth.user)
  const user=useSelector((state: any) => state.auth.user)
  const isLawyer = user?.account_type === "lawyer";
  //  const lawyerData = !isLawyer ? initialClient?.account_type=== : null;
  // Handle meeting scheduling
  const handleScheduleMeeting = async () => {
    if (!meetingLink.trim()) {
      toast({
        title: t("pages:clientDetails.error"),
        description: t("pleaseEnterMeetingLink"),
        variant: "destructive",
      })
      return
    }
    if (!profile?._id) {
      toast({
        title: t("pages:clientDetails.error"),
        description: t("pleaseLogin"),
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
          title: t("pages:clientDetails.success"),
          description: t("pages:clientDetails.meetingScheduled"),
          variant: "default",
        })
        setMeetingLink("")
        setMeetingDialogOpen(false)
      } else {
        throw new Error(response.message || t("pages:clientDetails.failedToScheduleMeeting"))
      }
    } catch (error: any) {
      console.error("Meeting scheduling error:", error)
      toast({
        title: t("pages:clientDetails.error"),
        description: error.message || t("pages:clientDetails.failedToScheduleMeeting"),
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
        title: t("pages:clientDetails.status.statusUpdated"),
        description: t("pages:clientDetails.status.clientStatusUpdated", { status }),
      })
    } catch (error) {
      toast({
        title: t("error"),
        description: t("pages:clientDetails.failedToUpdateStatus"),
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
        title: t("pages:clientDetails.notesUpdated"),
        description: t("pages:clientDetails.clientNotesUpdated"),
      })
      return true
    } catch (error) {
      toast({
        title: t("error"),
        description: t("pages:clientDetails.failedToUpdateNotes"),
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
            {t("pages:clientDetails.status.pending")}
          </Badge>
        )
      case "active":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
            {t("pages:clientDetails.status.active")}
          </Badge>
        )
      case "inactive":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
            {t("pages:clientDetails.status.inactive")}
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
     <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
  <h1 className="text-2xl font-bold">
    {isLawyer ? "Client Details" : "Lawyer Details"}
  </h1>

  <Button variant="outline" onClick={() => router.back()}>
    {isLawyer
      ? t("pages:clientDetails.backToClient")
      : t("pages:clientDetails.backToLawyer")}
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
            {user?.account_type !== "lawyer" && (
  <Button
    variant="outline"
    onClick={() => router.push("/qa")}
    title={t("pages:clientDetails.QA")}
  >
     <HelpCircle className="mr-2" size={16} />
    {t("pages:clientDetails.QA")}
  </Button>
)}

            <Button variant="outline" onClick={handleCreateChat} title={t("pages:clientDetails.createChat")}>
              <MessageSquare className="mr-2" size={16} />
              {t("pages:clientDetails.chat")}
            </Button>
            <Dialog open={meetingDialogOpen} onOpenChange={setMeetingDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" title={t("pages:clientDetails.scheduleMeeting")}>
                  <Calendar className="mr-2" size={16} />
                  {t("pages:clientDetails.scheduleMeeting")}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{t("pages:clientDetails.scheduleMeeting")}</DialogTitle>
                  <DialogDescription>
                    {t("pages:clientDetails.scheduleMeetingWith", { name: client.first_name })}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="meetingLink">{t("pages:clientDetails.meetingLink")}</Label>
                    <Input
                      id="meetingLink"
                      type="url"
                      placeholder={t("pages:clientDetails.meetingLinkPlaceholder")}
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
                      {t("pages:clientDetails.cancel")}
                    </Button>
                    <Button onClick={handleScheduleMeeting} disabled={!meetingLink.trim() || isSchedulingMeeting}>
                      {isSchedulingMeeting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t("pages:clientDetails.scheduling")}
                        </>
                      ) : (
                        <>
                          <Calendar className="mr-2 h-4 w-4" />
                          {t("pages:clientDetails.scheduleMeeting")}
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
              <h3 className="text-sm font-medium text-gray-500">{t("pages:clientDetails.email")}</h3>
              <p className="text-base">{client.email}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">{t("pages:clientDetails.phone")}</h3>
              <p className="text-base">{client.phone}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">{t("pages:clientDetails.address")}</h3>
              <p className="text-base">{client.address}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">{t("pages:clientDetails.clientSince")}</h3>
              <p className="text-base">{formatDate(client.createdAt)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">{t("pages:clientDetails.lastContact")}</h3>
              <p className="text-base">{formatDate(client.lastContactDate)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">{t("pages:clientDetails.activeCases")}</h3>
              <p className="text-base">{client.activeCases}</p>
            </div>
          </div>
          <Tabs defaultValue="cases" className="mt-6">
            <TabsList>
              <TabsTrigger value="cases">{t("pages:clientDetails.cases")}</TabsTrigger>
              <TabsTrigger value="notes">{t("pages:clientDetails.notes")}</TabsTrigger>
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
