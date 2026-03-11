'use client'

import { useState, useEffect, useMemo, useCallback, memo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Calendar,
  Search,
  Filter,
  ExternalLink,
  DollarSign,
  Loader2,
  Check,
  X,
  Video,
  Coins,
  Edit,
  Clock,
  User,
  Users,
  Copy,
  MoreHorizontal,
  Trash2,
  Play
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useSelector } from 'react-redux'
import { RootState } from '@/lib/store'
import { useTranslation } from '@/hooks/useTranslation'
import { getMeetings, approveMeeting, rejectMeeting, updateMeeting, updateMeetingStatus, type Meeting } from '@/lib/api/meeting-api-updated'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import EditMeetingModal from '@/components/modals/edit-meeting-modal'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import ConsultationTypeModal from "@/components/modals/consultation-type-modal"

interface VideoConsultationTableProps {
  searchQueryProp?: string;
  onNewConsultation: () => void;
}

export default function VideoConsultationTableNew({ searchQueryProp, onNewConsultation }: VideoConsultationTableProps) {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'Approved' | 'Pending' | 'History'>('Approved')
  const [historyStatusFilter, setHistoryStatusFilter] = useState<string>('all')

  // Use searchQueryProp if available, otherwise use internal searchTerm
  const currentSearchTerm = searchQueryProp !== undefined ? searchQueryProp : searchTerm;

  const [approvingMeeting, setApprovingMeeting] = useState<string | null>(null)
  const [rejectingMeeting, setRejectingMeeting] = useState<string | null>(null)
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isNewModalOpen, setIsNewModalOpen] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [meetingToCancel, setMeetingToCancel] = useState<Meeting | null>(null)
  const [cancellingStatus, setCancellingStatus] = useState(false)

  const { toast } = useToast()
  const { t } = useTranslation()
  const currentUser = useSelector((state: RootState) => state.auth.user)

  useEffect(() => {
    fetchMeetings()
  }, [])

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const response = await getMeetings();
      if (response.success && response.data) {
        const meetingsArray = Array.isArray(response.data) ? response.data : [response.data];
        setMeetings(meetingsArray);
      }
    } catch (error) {
      console.error('Error fetching meetings:', error);
      toast({
        title: "Error",
        description: "Failed to fetch meetings",
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }

  const getClientName = (meeting: Meeting) => {
    if (meeting.client_id && typeof meeting.client_id === 'object') {
      const first = (meeting.client_id as any).first_name || '';
      const last = (meeting.client_id as any).last_name || '';
      const name = `${first} ${last}`.trim();
      return name || 'N/A';
    }
    return 'N/A'
  }

  const getClientContact = (meeting: Meeting) => {
    if (meeting.client_id && typeof meeting.client_id === 'object') {
      return (meeting.client_id as any).phone || '-'
    }
    return '-'
  }

  const getRateAndType = (meeting: Meeting) => {
    if (meeting.consultation_type === 'free') return 'Free';
    const rate = meeting.hourly_rate || (meeting.lawyer_id as any).video_rate || 0;
    return `$${rate}`;
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      // DD.MM.YY format as seen in target design
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
      }).replace(/\//g, '.');
    } catch (e) {
      return '-';
    }
  }

  const formatTimeRange = (meeting: Meeting) => {
    const time = meeting.requested_time || (meeting as any).time;
    if (!time) return '-';

    try {
      const duration = (meeting as any).duration || 60;
      const [hours, minutes] = time.split(':').map(Number);
      const startDate = new Date();
      startDate.setHours(hours, minutes, 0, 0);

      const endDate = new Date(startDate.getTime() + duration * 60000);

      const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
      };

      // 24h format (15:00 - 15:30) as seen in target design
      return `${formatTime(startDate)} - ${formatTime(endDate)}`;
    } catch (e) {
      return time;
    }
  }

  const filteredMeetings = useMemo(() => {
    let filtered = meetings.filter(m => {
      if (activeTab === 'Approved') return ['approved', 'scheduled', 'active'].includes(m.status);
      if (activeTab === 'Pending') return m.status === 'pending_approval';
      if (activeTab === 'History') {
        const historyStatuses = ['completed', 'cancelled', 'rejected', 'expired', 'declined'];
        if (!historyStatuses.includes(m.status)) return false;

        if (historyStatusFilter === 'all') return true;
        if (historyStatusFilter === 'completed') return m.status === 'completed';
        if (historyStatusFilter === 'cancelled') return m.status === 'cancelled';
        if (historyStatusFilter === 'declined') return m.status === 'declined';
        if (historyStatusFilter === 'expired') return m.status === 'expired';
        return true;
      }
      return true;
    });

    if (currentSearchTerm) {
      const lower = currentSearchTerm.toLowerCase();
      filtered = filtered.filter(m =>
        getClientName(m).toLowerCase().includes(lower) ||
        (m.meeting_title || m.title || '').toLowerCase().includes(lower)
      );
    }

    return filtered;
  }, [meetings, activeTab, currentSearchTerm]);

  const counts = useMemo(() => ({
    Approved: meetings.filter(m => ['approved', 'scheduled', 'active'].includes(m.status)).length,
    Pending: meetings.filter(m => m.status === 'pending_approval').length,
    History: meetings.filter(m => ['completed', 'cancelled', 'rejected'].includes(m.status)).length,
  }), [meetings]);

  const handleCopyLink = (link?: string) => {
    if (!link) {
      toast({
        title: "No link available",
        variant: "destructive"
      });
      return;
    }

    try {
      navigator.clipboard.writeText(link);
      toast({
        description: (
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 bg-green-500 rounded-full flex items-center justify-center shrink-0">
              <Check className="h-3 w-3 text-white" strokeWidth={4} />
            </div>
            <span className="font-bold text-[#0F172A] text-[14px]">
              Meeting link copied
            </span>
          </div>
        ),
        // Simplified className to avoid potential issues
        className: "bg-white border-slate-200 shadow-lg",
      });
    } catch (err) {
      console.error('Failed to copy:', err);
      toast({
        title: "Copy failed",
        description: "Please try again or copy manually",
        variant: "destructive"
      });
    }
  }

  const handleJoin = (link?: string) => {
    if (!link) {
      toast({ title: "No link available", variant: "destructive" });
      return;
    }
    window.open(link, '_blank');
  }

  const openCancelModal = (meeting: Meeting) => {
    setMeetingToCancel(meeting)
    setShowCancelModal(true)
  }

  const handleConfirmCancel = async () => {
    if (!meetingToCancel) return

    try {
      setCancellingStatus(true)
      const response = await updateMeetingStatus(meetingToCancel._id, 'cancelled')
      if (response.success) {
        setMeetings(prev => prev.map(m => m._id === meetingToCancel._id ? { ...m, status: 'cancelled' } : m))
        toast({ title: "Meeting cancelled successfully" })
        setShowCancelModal(false)
      } else {
        throw new Error(response.message)
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to cancel meeting", variant: "destructive" })
    } finally {
      setCancellingStatus(false)
    }
  }

  const handleMeetingUpdated = (updatedMeeting: Meeting) => {
    setMeetings((prev) =>
      prev.map((meeting) => (meeting._id === updatedMeeting._id ? updatedMeeting : meeting))
    )
    toast({ title: "Meeting updated successfully" })
  }

  return (
    <div className="space-y-6">
      {/* Tabs & Actions Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-1">
        <div className="flex items-center gap-8">
          {(['Approved', 'Pending', 'History'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "relative pb-3 text-[15px] font-bold transition-all",
                activeTab === tab
                  ? "text-[#0F172A] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#0F172A]"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              {tab === 'Approved' ? t("pages:consultation.approved") : tab === 'Pending' ? t("pages:consultation.pending") : t("pages:consultation.history")}{tab === 'Pending' && counts.Pending > 0 ? ` (${counts.Pending})` : ''}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {activeTab === 'History' && (
            <div className="w-[180px]">
              <Select value={historyStatusFilter} onValueChange={setHistoryStatusFilter}>
                <SelectTrigger className="h-10 bg-white border-slate-300 rounded-md text-sm font-bold text-[#0F172A] focus:ring-0 focus:border-slate-400">
                  <SelectValue placeholder={t("pages:common.allStatuses")} />
                </SelectTrigger>
                <SelectContent className="border-slate-200 shadow-xl rounded-xl">
                  <SelectItem value="all" className="font-bold text-[13px] py-2.5 pl-9 pr-4 cursor-pointer focus:bg-slate-50">{t("pages:common.allStatuses")}</SelectItem>
                  <SelectItem value="completed" className="font-bold text-[13px] py-2.5 pl-9 pr-4 cursor-pointer focus:bg-slate-50">{t("pages:consultation.completed")}</SelectItem>
                  <SelectItem value="cancelled" className="font-bold text-[13px] py-2.5 pl-9 pr-4 cursor-pointer focus:bg-slate-50">{t("pages:consultation.cancelled")}</SelectItem>
                  <SelectItem value="declined" className="font-bold text-[13px] py-2.5 pl-9 pr-4 cursor-pointer focus:bg-slate-50">{t("pages:consultation.declined")}</SelectItem>
                  <SelectItem value="expired" className="font-bold text-[13px] py-2.5 pl-9 pr-4 cursor-pointer focus:bg-slate-50">{t("pages:consultation.expired")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="relative">
            <input
              type="text"
              placeholder={t("pages:common.search")}
              value={currentSearchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-4 pr-10 py-2 w-[240px] h-10 border border-slate-300 rounded-md text-sm focus:outline-none focus:border-slate-400 placeholder:text-slate-400 font-bold text-[#0F172A] bg-white transition-all"
            />
          </div>
          <Button
            onClick={onNewConsultation}
            className="bg-[#0F172A] hover:bg-[#1E293B] text-white font-bold h-10 px-6 rounded-md text-[13px] transition-all"
          >
            {t("pages:consultation.newVideoConsultation")}
          </Button>
        </div>
      </div>

      {/* Precise UI Table Container */}
      <div className="border border-slate-300 rounded-lg overflow-hidden bg-white shadow-sm mt-4">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-[#F1F5F9] border-b border-slate-300 text-left text-[#0F172A] text-[13px] font-bold">
                <th className="px-4 py-3 font-bold">{t("pages:consultation.clientName")}</th>
                <th className="px-4 py-3 font-bold">{t("pages:consultation.clientContact")}</th>
                <th className="px-4 py-3 font-bold">{t("pages:consultation.rateAndType")}</th>
                <th className="px-4 py-3 font-bold">
                  {activeTab === 'Pending' || activeTab === 'History' ? t("pages:consultation.bookingDate") : t("pages:consultation.date")}
                </th>
                <th className="px-4 py-3 font-bold">
                  {activeTab === 'Pending' || activeTab === 'History' ? t("pages:consultation.bookingTime") : t("pages:consultation.time")}
                </th>
                {activeTab === 'Pending' ? (
                  <>
                    <th className="px-4 py-3 font-bold">{t("pages:consultation.invite")}</th>
                    <th className="px-4 py-3 font-bold text-center">{t("pages:common.edit")}</th>
                  </>
                ) : activeTab === 'History' ? (
                  <>
                    <th className="px-4 py-3 font-bold">{t("pages:consultation.statusUpdated")}</th>
                  </>
                ) : (
                  <>
                    <th className="px-4 py-3 font-bold">{t("pages:consultation.consultationLink")}</th>
                    <th className="px-4 py-3 font-bold text-center">{t("pages:consultation.action")}</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse border-b border-slate-300 last:border-0">
                    <td colSpan={8} className="px-4 py-6 bg-slate-50"></td>
                  </tr>
                ))
              ) : filteredMeetings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-slate-500 bg-white">
                    <Video className="h-10 w-10 mx-auto mb-3 opacity-20 text-[#0F172A]" />
                    <p className="font-bold">{t("pages:consultation.noUsersFound")}</p>
                  </td>
                </tr>
              ) : (
                filteredMeetings.map((meeting) => (
                  <tr key={meeting._id} className="border-b border-slate-300 last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-bold text-[#0F172A] text-[13px] whitespace-nowrap">
                      {getClientName(meeting)}
                    </td>
                    <td className="px-4 py-3 text-[#0F172A] font-medium text-[13px] whitespace-nowrap">
                      {getClientContact(meeting)}
                    </td>
                    <td className="px-4 py-3 text-[#0F172A] font-bold text-[13px] whitespace-nowrap">
                      {getRateAndType(meeting)}
                    </td>
                    <td className="px-4 py-3 text-[#0F172A] font-bold text-[13px] whitespace-nowrap">
                      {formatDate(meeting.requested_date || meeting.date)}
                    </td>
                    <td className="px-4 py-3 text-[#0F172A] font-bold text-[13px] whitespace-nowrap">
                      {formatTimeRange(meeting)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "h-3 w-3 rounded-full shrink-0",
                          meeting.status === 'completed' || meeting.status === 'approved' || meeting.status === 'scheduled' ? "bg-[#4ADE80]" :
                            meeting.status === 'pending_approval' ? "bg-[#FFB600]" : "bg-slate-300"
                        )} />
                        <span className="text-[#0F172A] font-bold text-[13px]">
                          {meeting.status === 'completed' ? t("pages:consultation.completed") :
                            meeting.status === 'approved' || meeting.status === 'scheduled' ? t("pages:consultation.confirmed") :
                              meeting.status === 'pending_approval' ? t("pages:consultation.pendingClient") :
                                meeting.status === 'cancelled' ? t("pages:consultation.cancelledLawyer") :
                                  meeting.status === 'declined' ? t("pages:consultation.declinedClient") :
                                    meeting.status === 'expired' ? t("pages:consultation.expiredNoResponse") :
                                      meeting.status === 'rejected' ? t("pages:consultation.declined") : meeting.status}
                        </span>
                      </div>
                    </td>
                    {activeTab === 'Pending' ? (
                      <>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Button
                            variant="outline"
                            onClick={() => openCancelModal(meeting)}
                            className="h-8 px-3 bg-[#FFF5F5] border-[#FF0000] text-[#FF0000] hover:bg-[#FFE5E5] hover:text-[#D10000] text-[12px] font-bold rounded flex items-center gap-1.5 transition-all"
                          >
                            <X className="h-3.5 w-3.5" strokeWidth={3} />
                            {t("pages:consultation.cancelInvite")}
                          </Button>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => {
                                    setEditingMeeting(meeting)
                                    setIsEditModalOpen(true)
                                  }}
                                  className="p-1.5 hover:bg-slate-100 rounded transition-colors text-[#0F172A] inline-flex items-center justify-center"
                                >
                                  <Edit className="h-5 w-5" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent className="bg-[#0F172A] text-white border-none text-[12px] font-medium p-2 rounded-md">
                                <p>Edit details</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </td>
                      </>
                    ) : activeTab === 'History' ? (
                      <>
                        <td className="px-4 py-3 text-[#0F172A] font-bold text-[13px] whitespace-nowrap">
                          {(() => {
                            const d = new Date(meeting.updatedAt || meeting.createdAt || (meeting as any).updated_at || new Date());
                            const month = d.toLocaleDateString('en-US', { month: 'short' });
                            const day = d.getDate();
                            const year = d.getFullYear();
                            const hours = d.getHours().toString().padStart(2, '0');
                            const minutes = d.getMinutes().toString().padStart(2, '0');
                            const ampm = d.getHours() >= 12 ? 'PM' : 'AM';
                            return `${month} ${day}, ${year} - ${hours}:${minutes} ${ampm}`;
                          })()}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={() => handleCopyLink(meeting.meeting_link)}
                                    className="p-1.5 bg-[#F1F5F9] hover:bg-slate-200 rounded border border-slate-300 transition-colors text-[#0F172A]"
                                  >
                                    <Copy className="h-3.5 w-3.5" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent className="bg-[#0F172A] text-white border-none text-[11px] font-medium">
                                  <p>{t("pages:dashboard.copyLink")}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <Button
                              onClick={() => handleJoin(meeting.meeting_link)}
                              className="bg-[#0F172A] hover:bg-[#1E293B] text-white h-8 px-3 text-[12px] font-bold rounded flex items-center gap-1.5"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              {t("pages:consultation.join")}
                            </Button>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="p-1.5 hover:bg-slate-100 rounded transition-colors text-[#0F172A]">
                                <MoreHorizontal className="h-5 w-5" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[190px] p-1 shadow-lg border-slate-300">
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditingMeeting(meeting)
                                  setIsEditModalOpen(true)
                                }}
                                className="flex items-center gap-2 px-3 py-2 text-[13px] font-bold text-slate-700 cursor-pointer"
                              >
                                <Edit className="h-4 w-4" />
                                {t("pages:common.edit")}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => openCancelModal(meeting)}
                                className="flex items-center gap-2 px-3 py-2 text-[13px] font-bold text-red-500 cursor-pointer focus:text-red-600 focus:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                                {t("pages:consultation.cancelAppointment")}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Custom Cancel Modal */}
      <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <DialogContent className="sm:max-w-[480px] p-10 outline-none border-none shadow-2xl rounded-2xl">
          <div className="flex flex-col items-center text-center space-y-6">
            <h3 className="text-[22px] font-bold text-[#0F172A] tracking-tight">
              {activeTab === 'Pending' ? t("pages:consultation.cancelInviteTitle") : t("pages:consultation.cancelConsultationTitle")}
            </h3>
            <div className="space-y-4 w-full">
              {activeTab === 'Pending' && meetingToCancel && (
                <p className="text-[#0F172A] font-bold text-[15px]">
                  Client: {getClientName(meetingToCancel)}
                </p>
              )}
              {activeTab === 'Pending' && (
                <div className="text-left space-y-2">
                  <Label className="text-[13px] font-bold text-slate-600 ml-1">{t("pages:consultation.selectReasonOptional")}</Label>
                  <Select>
                    <SelectTrigger className="w-full h-11 bg-white border-slate-300 rounded-lg focus:ring-0 focus:border-[#0F172A] text-[14px] font-medium">
                      <SelectValue placeholder={t("pages:consultation.selectReasonOptional")} />
                    </SelectTrigger>
                    <SelectContent className="border-slate-200 shadow-xl rounded-xl">
                      <SelectItem value="schedule_conflict" className="font-bold text-[13px] py-3 cursor-pointer">{t("pages:consultation.scheduleConflict")}</SelectItem>
                      <SelectItem value="duplicate_request" className="font-bold text-[13px] py-3 cursor-pointer">{t("pages:consultation.duplicateRequest")}</SelectItem>
                      <SelectItem value="missing_info" className="font-bold text-[13px] py-3 cursor-pointer">{t("pages:consultation.missingInformation")}</SelectItem>
                      <SelectItem value="other" className="font-bold text-[13px] py-3 cursor-pointer">{t("pages:caseTypes.other")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              {activeTab !== 'Pending' && (
                <p className="text-slate-500 font-medium text-[15px]">
                  {t("pages:consultation.cannotBeUndone")}
                </p>
              )}
            </div>
            <div className="flex items-center gap-4 w-full pt-4">
              <Button
                variant="outline"
                onClick={() => setShowCancelModal(false)}
                className="flex-1 bg-[#E5E5E5] border-none text-[#0F172A] font-bold h-12 rounded-lg hover:bg-slate-300 transition-all"
              >
                {t("pages:consultation.back")}
              </Button>
              <Button
                onClick={handleConfirmCancel}
                disabled={cancellingStatus}
                className="flex-1 bg-[#FF0000] hover:bg-[#CC0000] text-white font-bold h-12 rounded-lg transition-all shadow-lg shadow-red-100"
              >
                {cancellingStatus ? <Loader2 className="h-5 w-5 animate-spin" /> : activeTab === 'Pending' ? t("pages:consultation.cancelInvite") : t("pages:consultation.confirmCancel")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <EditMeetingModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setEditingMeeting(null)
        }}
        meeting={editingMeeting as any}
        onMeetingUpdated={handleMeetingUpdated as any}
      />

      {/* New Consultation Modal */}
      <ConsultationTypeModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onConsultationScheduled={() => {
          setIsNewModalOpen(false)
          fetchMeetings()
          toast({ title: "Consultation requested successfully" })
        }}
      />
    </div>
  )
}