'use client'

import { useState, useEffect, useMemo, useCallback, memo } from 'react'
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
  Video,
  Coins,
  Edit,
  Clock
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useSelector } from 'react-redux'
import { RootState } from '@/lib/store'
import { useTranslation } from '@/hooks/useTranslation'
import { getMeetings, approveMeeting, rejectMeeting, updateMeeting } from '@/lib/api/meeting-api-updated'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import EditMeetingModal from '@/components/modals/edit-meeting-modal'

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
  consultation_type?: 'free' | 'paid'
  hourly_rate?: number
  custom_fee?: boolean
  createdAt: string
  updatedAt: string
}

export default function VideoConsultationTableNew() {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  // Removed filteredMeetings state - now using useMemo
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [approvingMeeting, setApprovingMeeting] = useState<string | null>(null)
  const [rejectingMeeting, setRejectingMeeting] = useState<string | null>(null)
  const [lawyerRatesCache, setLawyerRatesCache] = useState<{[key: string]: number}>({})
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const { toast } = useToast()
  const { t } = useTranslation()
  
  const currentUser = useSelector((state: RootState) => state.auth.user)

  // Function to fetch fresh lawyer rates
  const fetchLawyerRate = async (lawyerId: string): Promise<number> => {
    // Check cache first
    if (lawyerRatesCache[lawyerId] !== undefined) {
      return lawyerRatesCache[lawyerId]
    }

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/charges/charges/${lawyerId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        const rate = data.user?.video_rate || data.user?.charges || 0
        
        // Cache the rate
        setLawyerRatesCache(prev => ({ ...prev, [lawyerId]: rate }))
        return rate
      }
    } catch (error) {
      console.error('Error fetching lawyer rate:', error)
    }
    
    return 0
  }

  useEffect(() => {
    fetchMeetings()
  }, [])

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm])

  const fetchMeetings = async () => {
    try {
      setLoading(true)
      const response = await getMeetings()
      if (response.success && response.data) {
        const meetingsArray = Array.isArray(response.data) ? response.data : [response.data]
        
        
        
        setMeetings(meetingsArray)
        
        // Fetch fresh rates for all lawyers in the meetings
        const uniqueLawyerIds = new Set<string>()
        meetingsArray.forEach((meeting: Meeting) => {
          if (meeting.lawyer_id && typeof meeting.lawyer_id === 'object' && meeting.lawyer_id._id) {
            // Only fetch if we don't have hourly_rate in meeting and not cached
            if (meeting.hourly_rate === undefined && !lawyerRatesCache[meeting.lawyer_id._id]) {
              uniqueLawyerIds.add(meeting.lawyer_id._id)
            }
          }
        })
        
        // Fetch rates for unique lawyers
        Array.from(uniqueLawyerIds).forEach(lawyerId => {
          fetchLawyerRate(lawyerId) // This will cache the rate
        })
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

  const filteredMeetings = useMemo(() => {
    let filtered = meetings

    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(meeting => {
        const clientName = getClientName(meeting).toLowerCase()
        const lawyerName = getLawyerName(meeting).toLowerCase()
        const title = (meeting.meeting_title || meeting.title || '').toLowerCase()
        return clientName.includes(searchLower) ||
               lawyerName.includes(searchLower) ||
               title.includes(searchLower)
      })
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(meeting => meeting.status === statusFilter)
    }

    return filtered;
  }, [meetings, debouncedSearchTerm, statusFilter]);

  const getClientName = useCallback((meeting: Meeting) => {
    if (meeting.client_id && typeof meeting.client_id === 'object') {
      return `${meeting.client_id.first_name} ${meeting.client_id.last_name}`
    }
    return 'Unknown Client'
  }, [])

  const getLawyerName = useCallback((meeting: Meeting) => {
    if (meeting.lawyer_id && typeof meeting.lawyer_id === 'object') {
      return `${meeting.lawyer_id.first_name} ${meeting.lawyer_id.last_name}`
    }
    return 'Unknown Lawyer'
  }, [])

  const getLawyerCharges = useCallback((meeting: Meeting) => {
    
    // First priority: Use hourly_rate from the meeting (for new consultations)
    if (meeting.hourly_rate !== undefined && meeting.hourly_rate !== null) {
      return meeting.hourly_rate
    }
    
    // Check if the field has a different name in the API response
    const anyMeeting = meeting as any;
    if (anyMeeting.hourlyRate !== undefined && anyMeeting.hourlyRate !== null) {
      return anyMeeting.hourlyRate
    }
    if (anyMeeting.rate !== undefined && anyMeeting.rate !== null) {
      return anyMeeting.rate
    }
    if (anyMeeting.charges !== undefined && anyMeeting.charges !== null) {
      return anyMeeting.charges
    }
    
    // Second priority: Use cached rate if available
    if (meeting.lawyer_id && typeof meeting.lawyer_id === 'object' && lawyerRatesCache[meeting.lawyer_id._id]) {
      return lawyerRatesCache[meeting.lawyer_id._id]
    }
    
    // Third priority: Use profile data (may be outdated)
    if (meeting.lawyer_id && typeof meeting.lawyer_id === 'object') {
      return meeting.lawyer_id.video_rate || meeting.lawyer_id.charges || 0
    }
    
    return 0
  }, [lawyerRatesCache])

  const formatScheduledTime = useCallback((meeting: Meeting) => {
    
    // Try various field names that might be used by the API
    const anyMeeting = meeting as any;
    const date = meeting.requested_date || meeting.date || anyMeeting.requestedDate || anyMeeting.scheduledDate;
    const time = meeting.requested_time || meeting.time || anyMeeting.requestedTime || anyMeeting.scheduledTime;
    
    if (!date || date === '' || date === null) {
      return 'Not scheduled'
    }
    
    try {
      const formattedDate = new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric', 
        year: 'numeric'
      })
      
      return time && time !== '' && time !== null ? `${formattedDate} at ${time}` : formattedDate
    } catch (error) {
      console.error('Error formatting date:', date, error);
      return 'Invalid date'
    }
  }, [])

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

  const handleEditMeeting = (meeting: Meeting) => {
    setEditingMeeting(meeting)
    setIsEditModalOpen(true)
  }

  const handleMeetingUpdated = (updatedMeeting: Meeting) => {
    // Update local state with the updated meeting
    setMeetings((prev) =>
      prev.map((meeting) => (meeting._id === updatedMeeting._id ? updatedMeeting : meeting))
    )
    
    toast({
      title: t("pages:meeting.toasta.updatedTitle"),
      description: t("pages:meeting.toasta.updatedDescription"),
    })
  }

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false)
    setEditingMeeting(null)
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
              <SelectValue placeholder={t('pages:meeting.filter.placeholder')} />
              </SelectTrigger>
              <SelectContent>
              <SelectItem value="all">{t('pages:meeting.filter.all')}</SelectItem>
              <SelectItem value="pending_approval">{t('pages:meeting.filter.pending_approval')}</SelectItem>
      <SelectItem value="approved">{t('pages:meeting.filter.approved')}</SelectItem>
      <SelectItem value="active">{t('pages:meeting.filter.active')}</SelectItem>
      <SelectItem value="completed">{t('pages:meeting.filter.completed')}</SelectItem>
      <SelectItem value="cancelled">{t('pages:meeting.filter.cancelled')}</SelectItem>
      <SelectItem value="rejected">{t('pages:meeting.filter.rejected')}</SelectItem>
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
                <TableHead className="min-w-[120px]"> {t("pages:meeting.table.rateType")}</TableHead>
                <TableHead className="min-w-[180px]">{t('pages:meeting.table.time')}</TableHead>
                <TableHead className="min-w-[100px]">{t('pages:meeting.table.status')}</TableHead>
                <TableHead className="min-w-[200px]">{t('pages:meeting.table.link')}</TableHead>
                <TableHead className="min-w-[300px]">{t('pages:meeting.table.actions')}</TableHead>
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
                    <TableCell className="min-w-[120px]">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-1">
                          {meeting.consultation_type === 'free' ? (
                            <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                              Free
                            </span>
                          ) : (
                            <>
                              <DollarSign className="h-3 w-3 text-green-600" />
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-green-600">
                                  ${meeting.custom_fee && meeting.hourly_rate ? meeting.hourly_rate : getLawyerCharges(meeting)}
                                  {meeting.custom_fee && <span className="text-xs text-blue-600"></span>}
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                        {meeting.consultation_type === "free"
  ? t("pages:meeting.consultation.free")
  : t("pages:meeting.consultation.paid")}

                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="min-w-[180px]">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-1 text-sm">
                          <Clock className="h-3 w-3 text-gray-400" />
                          <span>{formatScheduledTime(meeting)}</span>
                        </div>
                        {meeting.meeting_title && (
                          <div className="text-xs text-gray-500 truncate max-w-[160px]">
                            {meeting.meeting_title}
                          </div>
                        )}
                        {meeting.meeting_description && (
                          <div className="text-xs text-gray-400 truncate max-w-[160px]">
                            {meeting.meeting_description}
                          </div>
                        )}
                      </div>
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
                    <TableCell className="min-w-[300px]">
                      <div className="flex gap-1 flex-wrap">
                        {/* Edit button for pending/approved meetings */}
                        {(meeting.status === 'pending_approval' || meeting.status === 'approved') && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-gray-600 hover:text-gray-700 hover:bg-gray-50 text-xs px-2 py-1"
                            onClick={() => handleEditMeeting(meeting)}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                             {t("pages:meeting.actions.edit")}
                          </Button>
                        )}
                        
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
      
      {/* Edit Meeting Modal */}
      <EditMeetingModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        meeting={editingMeeting}
        onMeetingUpdated={handleMeetingUpdated}
      />
    </Card>
  )
}
