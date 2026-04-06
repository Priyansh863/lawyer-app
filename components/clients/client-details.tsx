"use client"

import type { Client } from "@/types/client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSelector } from "react-redux"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MessageSquare, HelpCircle, Calendar, Loader2, Video, MessageCircle, Coins } from "lucide-react"
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
import { SimpleChat } from "@/components/chat/simple-chat"
import { useTranslation } from "@/hooks/useTranslation"
import ClientDocuments from "./client-documents"

interface ClientDetailsProps {
  client: Client & {
    video_rate?: number;
    chat_rate?: number;
  }
}

export default function ClientDetails({ client: initialClient }: ClientDetailsProps) {
  const { t } = useTranslation()
  const normalizeDateValue = (raw: string) => {
    if (!raw) return raw
    const parts = raw.split("-")
    if (parts.length === 3) {
      const [a, b, c] = parts
      if (a.length === 4) return raw
      if (c.length === 4) return `${c}-${b.padStart(2, "0")}-${a.padStart(2, "0")}`
    }
    return raw
  }
  console.log("initialClientinitialClientinitialClient", initialClient)
  const [client, setClient] = useState<Client & { video_rate?: number; chat_rate?: number }>(initialClient)
  const [meetingLink, setMeetingLink] = useState("")
  const [isSchedulingMeeting, setIsSchedulingMeeting] = useState(false)
  const [meetingDialogOpen, setMeetingDialogOpen] = useState(false)
  const [effectiveVideoRate, setEffectiveVideoRate] = useState<number>(0)
  const [requestedDate, setRequestedDate] = useState<string>("")
  const [requestedTime, setRequestedTime] = useState<string>("")
  const [endTime, setEndTime] = useState<string>("")
  const [endTimeTouched, setEndTimeTouched] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const profile = useSelector((state: RootState) => state.auth.user)
  const user = useSelector((state: any) => state.auth.user)
  const isLawyer = user?.account_type === "lawyer";
  //  const lawyerData = !isLawyer ? initialClient?.account_type=== : null;
  const getToken = () => {
    if (typeof window !== "undefined") {
      const directToken = localStorage.getItem("token")
      if (directToken) return directToken
      const localUser = localStorage.getItem("user")
      return localUser ? JSON.parse(localUser).token : null
    }
    return null
  }

  const getLawyerIdForMeeting = () => {
    if (profile?.account_type === "lawyer") {
      return (profile as any)?._id || (profile as any)?.id
    }
    return (client as any)?._id || (client as any)?.id
  }

  const fetchEffectiveVideoRate = async () => {
    const fallbackRate = Number(
      profile?.account_type === "lawyer"
        ? ((profile as any)?.video_rate || (profile as any)?.charges || 0)
        : ((client as any)?.video_rate || (client as any)?.charges || 0)
    ) || 0

    setEffectiveVideoRate(fallbackRate)

    const lawyerId = getLawyerIdForMeeting()
    if (!lawyerId) return

    try {
      const token = getToken()
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/charges/charges/${lawyerId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (res.ok) {
        const data = await res.json()
        const rate = Number(data?.user?.video_rate || data?.user?.charges || fallbackRate || 0)
        setEffectiveVideoRate(rate)
      }
    } catch (error) {
      console.error("Failed to fetch video rate:", error)
    }
  }

  useEffect(() => {
    if (meetingDialogOpen) {
      fetchEffectiveVideoRate()
      const now = new Date()
      const d = now.toISOString().split("T")[0]
      const t = now.toTimeString().split(" ")[0].substring(0, 5)
      setRequestedDate((prev) => prev || d)
      setRequestedTime((prev) => prev || t)
      setEndTime((prev) => {
        if (prev) return prev
        try {
          const [hh, mm] = t.split(":").map((x) => parseInt(x, 10))
          const base = new Date()
          base.setHours(hh)
          base.setMinutes(mm + 30)
          return `${String(base.getHours()).padStart(2, "0")}:${String(base.getMinutes()).padStart(2, "0")}`
        } catch {
          return ""
        }
      })
      setEndTimeTouched(false)
    }
  }, [meetingDialogOpen, profile?._id, client?._id])

  useEffect(() => {
    if (!meetingDialogOpen) return
    if (!requestedTime) return
    if (endTimeTouched) return
    try {
      const [hh, mm] = requestedTime.split(":").map((x) => parseInt(x, 10))
      const base = new Date()
      base.setHours(hh)
      base.setMinutes(mm + 30)
      setEndTime(`${String(base.getHours()).padStart(2, "0")}:${String(base.getMinutes()).padStart(2, "0")}`)
    } catch {
      // ignore
    }
  }, [meetingDialogOpen, requestedTime, requestedDate, endTimeTouched])

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
    if (!requestedDate || !requestedTime) {
      toast({
        title: t("pages:clientDetails.error"),
        description: "Please select a date and time",
        variant: "destructive",
      })
      return
    }
    if (!endTime) {
      toast({
        title: t("pages:clientDetails.error"),
        description: "Please select an end time",
        variant: "destructive",
      })
      return
    }
    let lawyer_id = profile.account_type === "lawyer" ? profile._id : client._id
    let client_id = profile.account_type === "client" ? profile._id : client._id

    console.log("lawyer_id", lawyer_id, profile.account_type)
    console.log("client_id", client_id, client.account_type)
    try {
      setIsSchedulingMeeting(true)
      const meetingData = {
        lawyerId: lawyer_id,
        clientId: client_id,
        meetingLink: meetingLink.trim(),
        requested_date: normalizeDateValue(requestedDate),
        requested_time: requestedTime,
        end_date: normalizeDateValue(requestedDate),
        end_time: endTime,
        consultation_type: "video",
        hourly_rate: Number(effectiveVideoRate || 0),
      }
      const response = await createMeeting(meetingData)
      console.log(response, "responseresponseresponseresponseresponseresponseresponse")
      if (response.success) {
        toast({
          title: "Meeting Request Sent",
          description: `Meeting request sent to ${client?.first_name}`,
        })
        setMeetingLink("")
        setMeetingDialogOpen(false)
        // Navigate to video consultations to see the scheduled meeting
        router.push('/video-consultations')
      } else {
        toast({
          title: t("pages:clientDetails.error"),
          description: response.message || t("pages:clientDetails.failedToScheduleMeeting"),
          variant: "destructive",
        })
        setMeetingLink("")
        setMeetingDialogOpen(false)
        return
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
    console.log("handleCreateChat", profile)
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
    <div className="space-y-8 mt-8">

      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold">
          {isLawyer ? "" : t("pages:lawyers.details")}
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
              <AvatarImage src={client.avatar || "/placeholder.svg?height=48&width=48"} alt={client?.first_name} />
              <AvatarFallback>{client?.first_name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-xl">{client?.first_name}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                {getStatusBadge(client?.status)}
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

            {/* Chat Button - Rate will be shown in chat header */}
            <div className="flex flex-col items-center gap-1">
              <Button variant="outline" onClick={handleCreateChat} title={t("pages:clientDetails.createChat")}>
                <MessageSquare className="mr-2" size={16} />
                {t("pages:clientDetails.chat")}
              </Button>
              {client.account_type === "lawyer" && user?.account_type === "client" && client.chat_rate ? (
                <div className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                  Chat fee: {client.chat_rate} tokens/min
                </div>
              ) : null}
            </div>

            {/* Video Meeting Button with Rate Display */}
            <div className="flex flex-col items-center gap-1">
              <Dialog open={meetingDialogOpen} onOpenChange={setMeetingDialogOpen} modal={false}>
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
                    <div className="p-3 rounded-md bg-slate-50 border border-slate-200 text-sm">
                      <div className="font-semibold text-[#0F172A]">Rate</div>
                      <div className="text-slate-600">{Number(effectiveVideoRate || 0)} tokens/hour</div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="meetingDate">Date</Label>
                        <Input
                          id="meetingDate"
                          type="date"
                          value={requestedDate}
                          onChange={(e) => setRequestedDate(e.target.value)}
                          onInput={(e) => setRequestedDate((e.target as HTMLInputElement).value)}
                          disabled={isSchedulingMeeting}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="meetingTime">Time</Label>
                        <Input
                          id="meetingTime"
                          type="time"
                          value={requestedTime}
                          onChange={(e) => setRequestedTime(e.target.value)}
                          disabled={isSchedulingMeeting}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="meetingEndTime">End</Label>
                        <Input
                          id="meetingEndTime"
                          type="time"
                          value={endTime}
                          onChange={(e) => {
                            setEndTimeTouched(true)
                            setEndTime(e.target.value)
                          }}
                          disabled={isSchedulingMeeting}
                        />
                      </div>
                    </div>

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

              {/* Show video rate for clients viewing lawyers */}
              {client.account_type === 'lawyer' && user?.account_type === 'client' && client.video_rate && (
                <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                  <Video className="w-3 h-3" />
                  <span>{client.video_rate} tokens/hour</span>
                </div>
              )}
            </div>
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

          {/* Consultation Rates Summary for Clients */}
          {client.account_type === 'lawyer' && user?.account_type === 'client' && (client.chat_rate || client.video_rate) && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Consultation Rates</h3>
              <div className="flex flex-wrap gap-4">
                {client.chat_rate && (
                  <div className="flex items-center gap-2 bg-green-100 px-3 py-2 rounded-md">
                    <MessageCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700">
                      Chat: {client.chat_rate} tokens/hour
                    </span>
                  </div>
                )}
                {client.video_rate && (
                  <div className="flex items-center gap-2 bg-blue-100 px-3 py-2 rounded-md">
                    <Video className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-700">
                      Video: {client.video_rate} tokens/hour
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          <Tabs defaultValue="cases" className="mt-6">
            <TabsList>
              <TabsTrigger value="cases">{t("pages:clientDetails.cases")}</TabsTrigger>
              <TabsTrigger value="documents">{t("pages:clientDetails.documents")}</TabsTrigger>
            </TabsList>
            <TabsContent value="cases" className="mt-4">
              <ClientCases clientId={client.id} />
            </TabsContent>
            <TabsContent value="documents" className="mt-4">
              <ClientDocuments clientId={client.id} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      {showChat && (
        <SimpleChat
          onClose={() => setShowChat(false)}
          clientId={client.id}
          clientName={`${client?.first_name} ${client?.last_name}`}
          clientAvatar={client?.avatar}
          chatRate={client?.chat_rate} // Pass chat rate to SimpleChat
        />
      )}
    </div>
  )
}
