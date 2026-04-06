"use client"

import React, { useEffect, useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogClose,
    DialogDescription,
    DialogPortal
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
    X,
    MessageSquare,
    Calendar,
    FolderOpen,
    Eye,
    PlayCircle,
    MoreHorizontal,
    Upload,
    Plus,
    Loader2,
    Clock
} from "lucide-react"
import type { Client } from "@/types/client"
import { cn } from "@/lib/utils"
import { useSelector } from "react-redux"
import type { RootState } from "@/lib/store"
import { useTranslation } from "@/hooks/useTranslation"
import { createMeeting } from "@/lib/api/meeting-api"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { SimpleChat } from "@/components/chat/simple-chat"
import ClientCases from "./client-cases"
import ClientDocuments from "./client-documents"

interface ClientDetailsDialogProps {
    clientData: Client & { video_rate?: number; chat_rate?: number } | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

export default function ClientDetailsDialog({ clientData, open, onOpenChange }: ClientDetailsDialogProps) {
    const normalizeDateValue = (raw: string) => {
      // Convert DD-MM-YYYY to YYYY-MM-DD for API payloads.
      if (!raw) return raw
      const parts = raw.split("-")
      if (parts.length === 3) {
        const [a, b, c] = parts
        if (a.length === 4) return raw
        if (c.length === 4) {
          return `${c}-${b.padStart(2, "0")}-${a.padStart(2, "0")}`
        }
      }
      return raw
    }
    const { t } = useTranslation()
    const { toast } = useToast()
    const router = useRouter()
    const profile = useSelector((state: RootState) => state.auth.user)
    const isClientViewer = profile?.account_type === "client"

    const [meetingLink, setMeetingLink] = useState("")
    const [isSchedulingMeeting, setIsSchedulingMeeting] = useState(false)
    const [meetingDialogOpen, setMeetingDialogOpen] = useState(false)
    const [showChat, setShowChat] = useState(false)
    const [effectiveVideoRate, setEffectiveVideoRate] = useState<number>(0)
    const [requestedDate, setRequestedDate] = useState<string>("")
    const [requestedTime, setRequestedTime] = useState<string>("")
    const [endTime, setEndTime] = useState<string>("")
    const [endTimeTouched, setEndTimeTouched] = useState(false)

    const getToken = () => {
        if (typeof window !== "undefined") {
            const directToken = localStorage.getItem("token")
            if (directToken) return directToken
            const user = localStorage.getItem("user")
            return user ? JSON.parse(user).token : null
        }
        return null
    }

    const getLawyerIdForMeeting = () => {
        if (profile?.account_type === "lawyer") {
            return (profile as any)?._id || (profile as any)?.id
        }
        return (clientData as any)?._id || (clientData as any)?.id
    }

    const fetchEffectiveVideoRate = async () => {
        const fallbackRate = Number(
            profile?.account_type === "lawyer"
                ? ((profile as any)?.video_rate || (profile as any)?.charges || 0)
                : ((clientData as any)?.video_rate || (clientData as any)?.charges || 0)
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
            // Prefill to next available defaults but still editable
            const today = new Date()
            const d = today.toISOString().split("T")[0]
            const t = today.toTimeString().split(" ")[0].substring(0, 5)
            setRequestedDate((prev) => prev || d)
            setRequestedTime((prev) => prev || t)
            // Default end time to +30 mins when possible
            setEndTime((prev) => {
              if (prev) return prev
              try {
                const [hh, mm] = t.split(":").map((x) => parseInt(x, 10))
                const base = new Date()
                base.setHours(hh)
                base.setMinutes(mm + 30)
                const end = `${String(base.getHours()).padStart(2, "0")}:${String(base.getMinutes()).padStart(2, "0")}`
                return end
              } catch {
                return ""
              }
            })
            setEndTimeTouched(false)
        }
    }, [meetingDialogOpen, profile?._id, clientData?._id])

    // Keep end time in sync with start time unless user manually edits it
    useEffect(() => {
      if (!meetingDialogOpen) return
      if (!requestedTime) return
      if (endTimeTouched) return
      try {
        const [hh, mm] = requestedTime.split(":").map((x) => parseInt(x, 10))
        const base = new Date()
        base.setHours(hh)
        base.setMinutes(mm + 30)
        const end = `${String(base.getHours()).padStart(2, "0")}:${String(base.getMinutes()).padStart(2, "0")}`
        setEndTime(end)
      } catch {
        // ignore
      }
    }, [meetingDialogOpen, requestedTime, requestedDate, endTimeTouched])

    if (!clientData) return null

    const formatDate = (dateString?: string) => {
        if (!dateString) return "2025. 10. 31";
        try {
            const date = new Date(dateString);
            return `${date.getFullYear()}. ${String(date.getMonth() + 1).padStart(2, '0')}. ${String(date.getDate()).padStart(2, '0')}`;
        } catch (e) {
            return "2025. 10. 31";
        }
    };

    const handleScheduleMeeting = async () => {
        if (!meetingLink.trim()) {
            toast({
                title: t("pages:clientDetails.error"),
                description: t("pages:clientDetails.pleaseEnterMeetingLink"),
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
        if (!profile?._id) {
            toast({
                title: t("pages:clientDetails.error"),
                description: t("pages:clientDetails.pleaseLogin"),
                variant: "destructive",
            })
            return
        }

        let lawyer_id = profile.account_type === "lawyer" ? profile._id : clientData._id
        let client_id = profile.account_type === "client" ? profile._id : clientData._id

        try {
            setIsSchedulingMeeting(true)
            const meetingData = {
                lawyerId: lawyer_id!,
                clientId: client_id!,
                meetingLink: meetingLink.trim(),
                requested_date: normalizeDateValue(requestedDate),
                requested_time: requestedTime,
                end_date: normalizeDateValue(requestedDate),
                end_time: endTime,
                consultation_type: "video",
                hourly_rate: Number(effectiveVideoRate || 0),
            }
            const response = await createMeeting(meetingData)
            if (response.success) {
                toast({
                    title: t("pages:commona.success"),
                    description: t("pages:clientDetails.meetingRequestSent", { name: clientData?.first_name }),
                })
                setMeetingLink("")
                setMeetingDialogOpen(false)
                router.push('/video-consultations')
            } else {
                toast({
                    title: t("pages:clientDetails.error"),
                    description: response.message || t("pages:clientDetails.failedToScheduleMeeting"),
                    variant: "destructive",
                })
            }
        } catch (error: any) {
            toast({
                title: t("pages:clientDetails.error"),
                description: error.message || t("pages:clientDetails.failedToScheduleMeeting"),
                variant: "destructive",
            })
        } finally {
            setIsSchedulingMeeting(false)
        }
    }

    return (
        <>
            {/* Keep this dialog modal behavior stable to avoid flicker when opening chat */}
            <Dialog
                open={open}
                onOpenChange={(nextOpen) => {
                    if (!nextOpen) {
                        setShowChat(false)
                        setMeetingDialogOpen(false)
                    }
                    onOpenChange(nextOpen)
                }}
                modal={false}
            >
                <DialogContent
                    className="max-w-[85vw] max-h-[96vh] overflow-y-auto p-0 border-none shadow-2xl left-[53%] translate-x-[-50%] bg-[#FFFFFF] z-[100] outline-none [&>button]:hidden"
                    onInteractOutside={(e) => {
                        // Always prevent closing by outside click — child components use dropdowns/dialogs via portals
                        e.preventDefault();
                    }}
                    onPointerDownOutside={(e) => {
                        e.preventDefault();
                    }}
                    onFocusOutside={(e) => {
                        // Prevent focus trap from pulling focus away from our separate Chat widget
                        e.preventDefault();
                    }}
                >
                    <div className="p-10 space-y-10">
                        {/* Header Section */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <h1 className="text-[20px] font-bold text-[#0F172A]">
                                  {isClientViewer ? t('pages:clientDetails.lawyerInformation') : t('pages:clientDetails.clientInformation')}
                                </h1>
                                <span className="text-[14px] text-slate-400 font-medium whitespace-nowrap">{t('pages:clientDetails.lastUpdatedColon')} {formatDate(clientData.lastContactDate || (clientData as any).updatedAt)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-2">
                                  <Button
                                      onClick={() => {
                                        setMeetingDialogOpen(false)
                                        setShowChat(true)
                                      }}
                                      className="bg-[#0F172A] hover:bg-[#1E293B] text-white px-8 h-[44px] rounded-[4px] flex items-center gap-2 text-[14px] font-semibold border-none"
                                  >
                                      <MessageSquare className="h-4 w-4" />
                                      {t('pages:clientDetails.chat')}
                                  </Button>
                                  {/* Show chat fee for clients viewing a lawyer */}
                                  {isClientViewer && (clientData as any)?.chat_rate ? (
                                    <div className="text-[12px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-md whitespace-nowrap">
                                      Chat fee: {(clientData as any).chat_rate} tokens/min
                                    </div>
                                  ) : null}
                                </div>
                                <Button
                                    onClick={() => {
                                      setShowChat(false)
                                      setMeetingDialogOpen(true)
                                    }}
                                    className="bg-[#0F172A] hover:bg-[#1E293B] text-white px-8 h-[44px] rounded-[4px] flex items-center gap-2 text-[14px] font-semibold border-none"
                                >
                                    <Clock className="h-4 w-4" />
                                    {t('pages:clientDetails.bookMeeting')}
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                      setShowChat(false)
                                      setMeetingDialogOpen(false)
                                      onOpenChange(false)
                                    }}
                                    className="h-[44px] w-[44px] p-0 ml-2 hover:bg-slate-100 rounded-md"
                                >
                                    <X className="h-5 w-5 text-slate-500" />
                                </Button>
                            </div>
                        </div>

                        {/* Client Profile Section */}
                        <div className="space-y-6">
                            <h2 className="text-[16px] font-bold text-[#0F172A] tracking-tight">
                              {isClientViewer ? t('pages:clientDetails.lawyerProfile') : t('pages:clientDetails.clientProfile')}
                            </h2>
                            <div className="grid grid-cols-3 gap-x-12 gap-y-6">
                                <div className="flex items-center gap-4">
                                    <label className="text-[12px] text-slate-400 font-bold min-w-[70px]">{t('pages:clientDetails.client')}</label>
                                    <Input
                                        value={`${clientData.first_name || ''} ${clientData.last_name || ''}`.trim() || "Akshay"}
                                        readOnly
                                        className="bg-[#f8f9fa] border-slate-200 h-[44px] text-[14px] font-semibold text-[#0F172A] rounded-[8px] px-4 w-full"
                                    />
                                </div>
                                <div className="flex items-center gap-4">
                                    <label className="text-[12px] text-slate-400 font-bold min-w-[70px]">{t('pages:clientDetails.email')}</label>
                                    <Input
                                        value={clientData.email || "Akshay@gmail.com"}
                                        readOnly
                                        className="bg-[#f8f9fa] border-slate-200 h-[44px] text-[14px] font-semibold text-[#0F172A] rounded-[8px] px-4 w-full"
                                    />
                                </div>
                                <div className="flex items-center gap-4">
                                    <label className="text-[12px] text-slate-400 font-bold min-w-[70px]">{t('pages:clientDetails.contact')}</label>
                                    <Input
                                        value={clientData.phone || "010 0000 0000"}
                                        readOnly
                                        className="bg-[#f8f9fa] border-slate-200 h-[44px] text-[14px] font-semibold text-[#0F172A] rounded-[8px] px-4 w-full"
                                    />
                                </div>
                                <div className="flex items-center gap-4">
                                    <label className="text-[12px] text-slate-400 font-bold min-w-[70px]">{t('pages:clientDetails.address')}</label>
                                    <Input
                                        value={clientData.address || "서울시 강남구 테헤란로 142 503호"}
                                        readOnly
                                        className="bg-[#f8f9fa] border-slate-200 h-[44px] text-[14px] font-semibold text-[#0F172A] rounded-[8px] px-4 w-full"
                                    />
                                </div>
                                <div className="flex items-center gap-4">
                                    <label className="text-[12px] text-slate-400 font-bold min-w-[130px]">{t('pages:clientDetails.registrationDate')}</label>
                                    <Input
                                        value={formatDate(clientData.createdAt)}
                                        readOnly
                                        className="bg-[#f8f9fa] border-slate-200 h-[44px] text-[14px] font-semibold text-[#0F172A] rounded-[8px] px-4 w-full"
                                    />
                                </div>
                                <div className="flex items-center gap-4">
                                    <label className="text-[12px] text-slate-400 font-bold min-w-[130px]">{t('pages:clientDetails.lastContactDate')}</label>
                                    <Input
                                        value={formatDate(clientData.lastContactDate || (clientData as any).updatedAt)}
                                        readOnly
                                        className="bg-[#f8f9fa] border-slate-200 h-[44px] text-[14px] font-semibold text-[#0F172A] rounded-[8px] px-4 w-full"
                                    />
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <label className="text-[12px] text-slate-400 font-bold min-w-[70px] pt-3">{t('pages:clientDetails.notes')}</label>
                                <Textarea
                                    value={clientData.notes || ""}
                                    readOnly
                                    className="bg-[#f8f9fa] border-slate-200 min-h-[160px] text-[14px] font-semibold text-[#0F172A] resize-none rounded-[8px] p-4 flex-1"
                                    placeholder=""
                                />
                            </div>
                        </div>

                        {/* Cases and Documents Sections */}
                        <div className="space-y-10">
                            <ClientCases clientId={clientData._id || clientData.id} />
                            <ClientDocuments clientId={clientData._id || clientData.id} />
                        </div>

                    </div>
                </DialogContent>
            </Dialog>

            {/* Schedule Meeting Dialog */}
            <Dialog open={meetingDialogOpen} onOpenChange={setMeetingDialogOpen} modal={false}>
                <DialogContent className="sm:max-w-md z-[130]">
                    <DialogHeader>
                        <DialogTitle>{t("pages:clientDetails.scheduleMeeting")}</DialogTitle>
                        <DialogDescription>
                            {t("pages:clientDetails.scheduleMeetingWith", { name: clientData.first_name })}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        {/* Rate display */}
                        <div className="p-3 rounded-md bg-slate-50 border border-slate-200 text-sm">
                          <div className="font-semibold text-[#0F172A]">Rate</div>
                          <div className="text-slate-600">
                            {Number(effectiveVideoRate || 0)} tokens/hour
                          </div>
                        </div>

                        {/* Date/Time selection */}
                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-2">
                            <Label htmlFor="meetingDate">Date</Label>
                            <Input
                              id="meetingDate"
                              type="date"
                              value={requestedDate}
                              onChange={(e) => setRequestedDate(e.target.value)}
                              min={new Date().toISOString().split("T")[0]}
                              className="cursor-pointer"
                              onFocus={(e) => e.target.showPicker()}
                              onClick={(e) => e.currentTarget.showPicker()}
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
                              className="cursor-pointer"
                              onFocus={(e) => e.target.showPicker()}
                              onClick={(e) => e.currentTarget.showPicker()}
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
                              className="cursor-pointer"
                              onFocus={(e) => e.target.showPicker()}
                              onClick={(e) => e.currentTarget.showPicker()}
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
                            <Button className="bg-[#0F172A] hover:bg-[#1E293B]" onClick={handleScheduleMeeting} disabled={!meetingLink.trim() || isSchedulingMeeting}>
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

            {/* Chat Modal - Rendered OUTSIDE Dialog to prevent layout stretching from fixed position */}
            {showChat && (
                <SimpleChat
                    onClose={() => setShowChat(false)}
                    clientId={clientData._id || clientData.id}
                    clientName={`${clientData?.first_name} ${clientData?.last_name}`}
                    clientAvatar={clientData?.avatar}
                    chatRate={clientData?.chat_rate}
                />
            )}
        </>
    )
}
