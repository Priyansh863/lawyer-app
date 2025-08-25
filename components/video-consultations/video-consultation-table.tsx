"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Video, ExternalLink, Loader2, Calendar, X, Check, DollarSign } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/hooks/useTranslation"
import { getMeetings, updateMeetingStatus, approveMeeting, rejectMeeting, type Meeting } from "@/lib/api/meeting-api"
import Skeleton from "react-loading-skeleton"
import "react-loading-skeleton/dist/skeleton.css"

const searchFormSchema = z.object({
  query: z.string(),
})

type SearchFormData = z.infer<typeof searchFormSchema>

type VideoConsultationTableProps = {}

export default function VideoConsultationTable({}: VideoConsultationTableProps) {
  const { t } = useTranslation()
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [filteredMeetings, setFilteredMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingMeeting, setUpdatingMeeting] = useState<string | null>(null)
  const [approvingMeeting, setApprovingMeeting] = useState<string | null>(null)
  const [rejectingMeeting, setRejectingMeeting] = useState<string | null>(null)
  const { toast } = useToast()

  const searchForm = useForm<SearchFormData>({
    resolver: zodResolver(searchFormSchema),
    defaultValues: {
      query: "",
    },
  })

  useEffect(() => {
    fetchMeetings()
  }, [])

  useEffect(() => {
    const query = searchForm.watch("query")
    if (query) {
      const filtered = meetings.filter(
        (meeting) =>
          meeting.client_id?.first_name?.toLowerCase().includes(query.toLowerCase()) ||
          meeting.client_id?.last_name?.toLowerCase().includes(query.toLowerCase()) ||
          meeting.lawyer_id?.first_name?.toLowerCase().includes(query.toLowerCase()) ||
          meeting.lawyer_id?.last_name?.toLowerCase().includes(query.toLowerCase()) ||
          meeting.title?.toLowerCase().includes(query.toLowerCase()) ||
          meeting.description?.toLowerCase().includes(query.toLowerCase())
      )
      setFilteredMeetings(filtered)
    } else {
      setFilteredMeetings(meetings)
    }
  }, [searchForm.watch("query"), meetings])

  const fetchMeetings = async () => {
    try {
      setLoading(true)
      const response: any = await getMeetings()
      if (response.success && response.data) {
        setMeetings(response.data)
        setFilteredMeetings(response.data)
      }
    } catch (error: any) {
      toast({
        title: t('pages:meeting.toast.error.title'),
        description: error.message || t('pages:meeting.toast.error.description'),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusKey = status.toLowerCase()
    const variants = {
      pending: 'secondary',
      approved: 'secondary',
      active: 'secondary',
      completed: 'secondary',
      cancelled: 'secondary',
      rejected: 'secondary'
    } as const
    
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      approved: 'bg-green-100 text-green-800 border-green-200',
      active: 'bg-blue-100 text-blue-800 border-blue-200',
      completed: 'bg-gray-100 text-gray-800 border-gray-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
      rejected: 'bg-red-100 text-red-800 border-red-200'
    }

    return (
      <Badge variant={variants[statusKey as keyof typeof variants] || 'secondary'} className={colors[statusKey as keyof typeof colors]}>
        {t(`pages:meeting.status.${statusKey}`)}
      </Badge>
    )
  }

  const handleConnectToMeeting = (meeting: Meeting) => {
    if (meeting.meeting_link) {
      window.open(meeting.meeting_link, "_blank")
      toast({
        title: t('pages:meeting.toast.connect.title'),
        description: t('pages:meeting.toast.connect.description', { name: getClientName(meeting) }),
      })
    } else {
      toast({
        title: t('pages:meeting.toast.noLink.title'),
        description: t('pages:meeting.toast.noLink.description'),
        variant: "destructive",
      })
    }
  }

  const handleCloseMeeting = async (meetingId: string) => {
    try {
      setUpdatingMeeting(meetingId)
      const response = await updateMeetingStatus(meetingId, "completed")
      if (response.success) {
        setMeetings((prev) =>
          prev.map((meeting) => (meeting._id === meetingId ? { ...meeting, status: "completed" as const } : meeting)),
        )
        setFilteredMeetings((prev) =>
          prev.map((meeting) => (meeting._id === meetingId ? { ...meeting, status: "completed" as const } : meeting)),
        )
        toast({
          title: t('pages:meeting.toast.closed.title'),
          description: t('pages:meeting.toast.closed.description'),
        })
      } else {
        throw new Error(response.message || t('pages:meeting.errors.closeFailed'))
      }
    } catch (error: any) {
      toast({
        title: t('pages:meeting.toast.error.title'),
        description: error.message || t('pages:meeting.errors.generic'),
        variant: "destructive",
      })
    } finally {
      setUpdatingMeeting(null)
    }
  }

  const handleApproveMeeting = async (meetingId: string) => {
    try {
      setApprovingMeeting(meetingId)
      const response = await approveMeeting(meetingId)
      if (response.success) {
        setMeetings((prev) =>
          prev.map((meeting) => 
            meeting._id === meetingId 
              ? { ...meeting, status: "approved" as const, meeting_link: response.data?.meeting_link || meeting.meeting_link } 
              : meeting
          ),
        )
        setFilteredMeetings((prev) =>
          prev.map((meeting) => 
            meeting._id === meetingId 
              ? { ...meeting, status: "approved" as const, meeting_link: response.data?.meeting_link || meeting.meeting_link } 
              : meeting
          ),
        )
        toast({
          title: t('pages:meeting.toast.approved.title'),
          description: t('pages:meeting.toast.approved.description'),
        })
      } else {
        throw new Error(response.message || t('pages:meeting.errors.approveFailed'))
      }
    } catch (error: any) {
      toast({
        title: t('pages:meeting.toast.error.title'),
        description: error.message || t('pages:meeting.errors.generic'),
        variant: "destructive",
      })
    } finally {
      setApprovingMeeting(null)
    }
  }

  const handleRejectMeeting = async (meetingId: string) => {
    try {
      setRejectingMeeting(meetingId)
      const response = await rejectMeeting(meetingId)
      if (response.success) {
        setMeetings((prev) =>
          prev.map((meeting) => (meeting._id === meetingId ? { ...meeting, status: "rejected" as const } : meeting)),
        )
        setFilteredMeetings((prev) =>
          prev.map((meeting) => (meeting._id === meetingId ? { ...meeting, status: "rejected" as const } : meeting)),
        )
        toast({
          title: t('pages:meeting.toast.rejected.title'),
          description: t('pages:meeting.toast.rejected.description'),
        })
      } else {
        throw new Error(response.message || t('pages:meeting.errors.rejectFailed'))
      }
    } catch (error: any) {
      toast({
        title: t('pages:meeting.toast.error.title'),
        description: error.message || t('pages:meeting.errors.generic'),
        variant: "destructive",
      })
    } finally {
      setRejectingMeeting(null)
    }
  }

  const formatScheduledTime = (meeting: Meeting) => {
    if (meeting.date && meeting.time) {
      return t('pages:meeting.time.scheduled', {
        date: new Date(meeting.date).toLocaleDateString(),
        time: meeting.time
      })
    } else if (meeting.createdAt) {
      return formatDate(meeting.createdAt, true)
    }
    return t('pages:meeting.time.notScheduled')
  }

  const getClientName = (meeting: Meeting) => {
    if (meeting.client_id && typeof meeting.client_id === 'object') {
      return `${meeting.client_id.first_name || ''} ${meeting.client_id.last_name || ''}`.trim() || t('pages:meeting.unknown.client')
    }
    return t('meeting.unknown.client')
  }

  const getLawyerName = (meeting: Meeting) => {
    if (meeting.lawyer_id && typeof meeting.lawyer_id === 'object') {
      return `${meeting.lawyer_id.first_name || ''} ${meeting.lawyer_id.last_name || ''}`.trim() || t('pages:meeting.unknown.lawyer')
    }
    return t('pages:meeting.unknown.lawyer')
  }

  const getLawyerCharges = (meeting: Meeting) => {
    if (meeting.lawyer_id && typeof meeting.lawyer_id === 'object' && meeting.lawyer_id.charges) {
      return meeting.lawyer_id.charges
    }
    return 0
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex w-full max-w-sm items-center space-x-2">
        <Form {...searchForm}>
          <FormField
            control={searchForm.control}
            name="query"
            render={({ field }) => (
              <FormItem className="flex-1 relative">
                <FormControl>
                  <div className="relative">
                    <Input
                      placeholder={t('pages:meeting.search.placeholder')}
                      {...field}
                      className="bg-[#F5F5F5] border-gray-200 pl-10"
                    />
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"
                    >
                      <circle cx="11" cy="11" r="8" />
                      <path d="m21 21-4.3-4.3" />
                    </svg>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </Form>
      </div>

      {/* Meetings Table */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[120px]">{t('pages:meeting.table.client')}</TableHead>
                <TableHead className="min-w-[120px]">{t('pages:meeting.table.lawyer')}</TableHead>
                <TableHead className="min-w-[100px]">{t('pages:meeting.table.charges')}</TableHead>
                <TableHead className="min-w-[150px]">{t('pages:meeting.table.time')}</TableHead>
                <TableHead className="min-w-[100px]">{t('pages:meeting.table.status')}</TableHead>
                <TableHead className="min-w-[200px]">{t('pages:meeting.table.link')}</TableHead>
                <TableHead className="min-w-[250px]">{t('pages:meeting.table.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                // Skeleton loading state
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index} className={index % 2 === 0 ? "bg-gray-50" : ""}>
                    <TableCell><Skeleton width={100} /></TableCell>
                    <TableCell><Skeleton width={100} /></TableCell>
                    <TableCell><Skeleton width={60} /></TableCell>
                    <TableCell><Skeleton width={120} /></TableCell>
                    <TableCell><Skeleton width={80} height={24} /></TableCell>
                    <TableCell><Skeleton width={150} /></TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        <Skeleton width={80} height={32} />
                        <Skeleton width={80} height={32} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredMeetings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    <div className="flex flex-col items-center space-y-2">
                      <Calendar className="h-8 w-8 text-gray-400" />
                      <span>{t('pages:meeting.empty')}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredMeetings.map((meeting: Meeting, index: number) => (
                  <TableRow key={meeting._id} className={index % 2 === 0 ? "bg-gray-50" : ""}>
                    <TableCell className="min-w-[120px] font-medium">
                      {getClientName(meeting)}
                    </TableCell>
                    <TableCell className="min-w-[120px] font-medium">
                      {getLawyerName(meeting)}
                    </TableCell>
                    <TableCell className="min-w-[100px]">
                      <div className="flex items-center space-x-1">
                        <DollarSign className="h-3 w-3 text-green-600" />
                        <span className="text-sm font-medium text-green-600">
                          {getLawyerCharges(meeting)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="min-w-[150px]">
                      <div className="text-sm">
                        {formatScheduledTime(meeting)}
                      </div>
                      {meeting.title && (
                        <div className="text-xs text-gray-500 mt-1 truncate max-w-[140px]">
                          {meeting.title}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="min-w-[100px]">
                      {getStatusBadge(meeting.status || "scheduled")}
                    </TableCell>
                    <TableCell className="min-w-[200px]">
                      {meeting.meeting_link ? (
                        <div className="flex items-center space-x-2">
                          <ExternalLink className="h-3 w-3 text-blue-600" />
                          <span className="text-xs text-blue-600 truncate max-w-[150px]">
                            {meeting.meeting_link}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500">{t('meeting.noLink')}</span>
                      )}
                    </TableCell>
                    <TableCell className="min-w-[250px]">
                      <div className="flex gap-1 flex-wrap">
                        {meeting.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1"
                              onClick={() => handleApproveMeeting(meeting._id)}
                              disabled={approvingMeeting === meeting._id}
                            >
                              {approvingMeeting === meeting._id ? (
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              ) : (
                                <Check className="h-3 w-3 mr-1" />
                              )}
                              {t('pages:meeting.actions.approve')}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs px-2 py-1"
                              onClick={() => handleRejectMeeting(meeting._id)}
                              disabled={rejectingMeeting === meeting._id}
                            >
                              {rejectingMeeting === meeting._id ? (
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              ) : (
                                <X className="h-3 w-3 mr-1" />
                              )}
                              {t('pages:meeting.actions.reject')}
                            </Button>
                          </>
                        )}
                        
                        {(meeting.status === "approved" || meeting.status === "active") && meeting.meeting_link && (
                          <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1"
                            onClick={() => handleConnectToMeeting(meeting)}
                          >
                            <Video className="h-3 w-3 mr-1" />
                            {t('pages:meeting.actions.connect')}
                          </Button>
                        )}
                        
                        {meeting.status === "active" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-gray-600 hover:text-gray-700 hover:bg-gray-50 text-xs px-2 py-1"
                            onClick={() => handleCloseMeeting(meeting._id)}
                            disabled={updatingMeeting === meeting._id}
                          >
                            {updatingMeeting === meeting._id ? (
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            ) : (
                              <X className="h-3 w-3 mr-1" />
                            )}
                            {t('pages:pages:meeting.actions.close')}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}