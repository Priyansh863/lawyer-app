"use client"

import React, { useState } from "react"
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
    Video,
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
    const { t } = useTranslation()
    const { toast } = useToast()
    const router = useRouter()
    const profile = useSelector((state: RootState) => state.auth.user)

    const [meetingLink, setMeetingLink] = useState("")
    const [isSchedulingMeeting, setIsSchedulingMeeting] = useState(false)
    const [meetingDialogOpen, setMeetingDialogOpen] = useState(false)
    const [showChat, setShowChat] = useState(false)

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
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent
                    className="max-w-[85vw] max-h-[96vh] overflow-y-auto p-0 border-none shadow-2xl left-[53%] translate-x-[-50%] bg-[#FFFFFF] z-[100] outline-none [&>button]:hidden"
                    onInteractOutside={(e) => {
                        // Always prevent closing by outside click — child components use dropdowns/dialogs via portals
                        e.preventDefault();
                    }}
                    onPointerDownOutside={(e) => {
                        e.preventDefault();
                    }}
                >
                    <div className="p-10 space-y-10">
                        {/* Header Section */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <h1 className="text-[20px] font-bold text-[#0F172A]">{t('pages:clientDetails.clientInformation')}</h1>
                                <span className="text-[14px] text-slate-400 font-medium whitespace-nowrap">{t('pages:clientDetails.lastUpdatedColon')} {formatDate(clientData.lastContactDate || (clientData as any).updatedAt)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    onClick={() => setShowChat(true)}
                                    className="bg-[#0F172A] hover:bg-[#1E293B] text-white px-8 h-[44px] rounded-[4px] flex items-center gap-2 text-[14px] font-semibold border-none"
                                >
                                    <MessageSquare className="h-4 w-4" />
                                    {t('pages:clientDetails.chat')}
                                </Button>
                                <Button
                                    onClick={() => setMeetingDialogOpen(true)}
                                    className="bg-[#0F172A] hover:bg-[#1E293B] text-white px-8 h-[44px] rounded-[4px] flex items-center gap-2 text-[14px] font-semibold border-none"
                                >
                                    <Clock className="h-4 w-4" />
                                    {t('pages:clientDetails.bookMeeting')}
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => onOpenChange(false)}
                                    className="h-[44px] w-[44px] p-0 ml-2 hover:bg-slate-100 rounded-md"
                                >
                                    <X className="h-5 w-5 text-slate-500" />
                                </Button>
                            </div>
                        </div>

                        {/* Client Profile Section */}
                        <div className="space-y-6">
                            <h2 className="text-[16px] font-bold text-[#0F172A] tracking-tight">{t('pages:clientDetails.clientProfile')}</h2>
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

            {/* Chat Modal - Rendered OUTSIDE the main Dialog component to avoid focus trap/event interference */}
            {showChat && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center pointer-events-auto">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setShowChat(false)} />
                    <div className="relative z-10" onClick={(e) => e.stopPropagation()}>
                        <SimpleChat
                            onClose={() => setShowChat(false)}
                            clientId={clientData._id || clientData.id}
                            clientName={`${clientData?.first_name} ${clientData?.last_name}`}
                            clientAvatar={clientData?.avatar}
                            chatRate={clientData?.chat_rate}
                        />
                    </div>
                </div>
            )}

            {/* Schedule Meeting Dialog */}
            <Dialog open={meetingDialogOpen} onOpenChange={setMeetingDialogOpen}>
                <DialogContent className="sm:max-w-md z-[130]">
                    <DialogHeader>
                        <DialogTitle>{t("pages:clientDetails.scheduleMeeting")}</DialogTitle>
                        <DialogDescription>
                            {t("pages:clientDetails.scheduleMeetingWith", { name: clientData.first_name })}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
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
        </>
    )
}
