'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
  Video
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useSelector } from 'react-redux'
import { RootState } from '@/lib/store'
import { useTranslation } from '@/hooks/useTranslation'
import { getMeetings, approveMeeting, rejectMeeting } from '@/lib/api/meeting-api-updated'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

interface Meeting {
  _id: string
  lawyer_id: {
    _id: string
    first_name: string
    last_name: string
    email: string
    account_type: string
    charges?: number
    video_rate?: number
    chat_rate?: number
  }
  client_id: {
    _id: string
    first_name: string
    last_name: string
    email: string
    account_type: string
  }
  created_by?: {
    _id: string
    account_type: string
  }
  meeting_title?: string
  title?: string
  meeting_description?: string
  description?: string
  requested_date?: string
  date?: string
  requested_time?: string
  time?: string
  meeting_link?: string
  status: 'pending_approval' | 'approved' | 'rejected' | 'scheduled' | 'active' | 'completed' | 'cancelled'
  approval_date?: string
  rejection_reason?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export default function VideoConsultationTableNew() {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [filteredMeetings, setFilteredMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [approvingMeeting, setApprovingMeeting] = useState<string | null>(null)
  const [rejectingMeeting, setRejectingMeeting] = useState<string | null>(null)
  const { toast } = useToast()
  const { t } = useTranslation()
  
  const currentUser = useSelector((state: RootState) => state.auth.user)

  useEffect(() => {
    fetchMeetings()
  }, [])

  useEffect(() => {
    filterMeetings()
  }, [meetings, searchTerm, statusFilter])

  const fetchMeetings = async () => {
    try {
      setLoading(true)
      const response = await getMeetings()
      if (response.success && response.data) {
        const meetingsArray = Array.isArray(response.data) ? response.data : [response.data]
        setMeetings(meetingsArray)
      }
    } catch (error) {
      console.error('Error fetching meetings:', error)
      toast({
        title: t('pages:meeting.toast.error.title'),
        description: t('pages:meeting.errors.fetchFailed'),
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const filterMeetings = () => {
    let filtered = meetings

    if (searchTerm) {
      filtered = filtered.filter(meeting => {
        const clientName = getClientName(meeting).toLowerCase()
        const lawyerName = getLawyerName(meeting).toLowerCase()
        const title = (meeting.meeting_title || meeting.title || '').toLowerCase()
        return clientName.includes(searchTerm.toLowerCase()) ||
               lawyerName.includes(searchTerm.toLowerCase()) ||
               title.includes(searchTerm.toLowerCase())
      })
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(meeting => meeting.status === statusFilter)
    }

    setFilteredMeetings(filtered)
  }

  const getClientName = (meeting: Meeting) => {
    if (meeting.client_id && typeof meeting.client_id === 'object') {
      return `${meeting.client_id.first_name} ${meeting.client_id.last_name}`
    }
    return 'Unknown Client'
  }

  const getLawyerName = (meeting: Meeting) => {
    if (meeting.lawyer_id && typeof meeting.lawyer_id === 'object') {
      return `${meeting.lawyer_id.first_name} ${meeting.lawyer_id.last_name}`
    }
    return 'Unknown Lawyer'
  }

  const getLawyerCharges = (meeting: Meeting) => {
    if (meeting.lawyer_id && typeof meeting.lawyer_id === 'object') {
      return meeting.lawyer_id.video_rate || meeting.lawyer_id.charges || 0
    }
    return 0
  }

  const formatScheduledTime = (meeting: Meeting) => {
    const date = meeting.requested_date || meeting.date
    const time = meeting.requested_time || meeting.time
    
    if (!date) return 'Not scheduled'
    
    const formattedDate = new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
    
    return time ? `${formattedDate} at ${time}` : formattedDate
  }

  // Check if approve/reject buttons should be shown
  const shouldShowApproveReject = (meeting: Meeting) => {
    if (!currentUser) return false
    
    // Only lawyers can see approve/reject buttons
    if (currentUser.account_type !== 'lawyer') return false
    
    // Only show for pending_approval meetings
    if (meeting.status !== 'pending_approval') return false
    
    // Check if meeting was created by a client
    if (meeting.created_by && typeof meeting.created_by === 'object') {
      return meeting.created_by.account_type === 'client'
    }
    
    // Fallback: check if client_id exists and is different from current user
    if (meeting.client_id && typeof meeting.client_id === 'object') {
      return meeting.client_id._id !== currentUser._id
    }
    
    return false
  }

  const handleConnectToMeeting = (meeting: Meeting) => {
    if (meeting.meeting_link) {
      window.open(meeting.meeting_link, '_blank')
    } else {
      toast({
        title: t('pages:meeting.toast.error.title'),
        description: t('pages:meeting.errors.noLink'),
        variant: 'destructive'
      })
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

  const getStatusBadge = (status: string) => {
    const statusKey = status.toLowerCase()
    const variants = {
      pending_approval: 'secondary',
      approved: 'secondary',
      active: 'secondary',
      completed: 'secondary',
      cancelled: 'secondary',
      rejected: 'secondary'
    } as const
    
    const colors = {
      pending_approval: 'bg-yellow-100 text-yellow-800 border-yellow-200',
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5" />
          {t('pages:meeting.header.title')}
        </CardTitle>
        <CardDescription>
          {t('pages:meeting.header.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder={t('pages:meeting.search.placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending_approval">Pending Approval</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Meetings Table */}
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
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
                      {meeting.meeting_title && (
                        <div className="text-xs text-gray-500 mt-1 truncate max-w-[140px]">
                          {meeting.meeting_title}
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
                        {/* Show approve/reject buttons only for lawyers when meeting is pending_approval */}
                        {shouldShowApproveReject(meeting) && (
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
                        
                        {/* Connect button for approved/active meetings */}
                        {(meeting.status === 'approved' || meeting.status === 'active') && meeting.meeting_link && (
                          <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1"
                            onClick={() => handleConnectToMeeting(meeting)}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            {t('pages:meeting.actions.connect')}
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
      </CardContent>
    </Card>
  )
}
