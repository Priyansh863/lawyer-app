"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Video, ExternalLink, Loader2, Calendar, X, Check, DollarSign, Edit, Clock } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { getMeetings, updateMeetingStatus, approveMeeting, rejectMeeting, updateMeeting, type Meeting } from "@/lib/api/meeting-api"
import EditMeetingModal from "@/components/modals/edit-meeting-modal"

const searchFormSchema = z.object({
  query: z.string(),
})

type SearchFormData = z.infer<typeof searchFormSchema>

type VideoConsultationTableProps = {}

export default function VideoConsultationTable({}: VideoConsultationTableProps) {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [filteredMeetings, setFilteredMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingMeeting, setUpdatingMeeting] = useState<string | null>(null)
  const [approvingMeeting, setApprovingMeeting] = useState<string | null>(null)
  const [rejectingMeeting, setRejectingMeeting] = useState<string | null>(null)
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
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
        title: "Error",
        description: error.message || "Failed to fetch meetings",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
            Pending
          </Badge>
        )
      case "approved":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
            Approved
          </Badge>
        )
      case "active":
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
            Active
          </Badge>
        )
      case "completed":
        return (
          <Badge variant="secondary" className="bg-gray-100 text-gray-800 border-gray-200">
            Completed
          </Badge>
        )
      case "cancelled":
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-200">
            Cancelled
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-200">
            Rejected
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary">
            {status}
          </Badge>
        )
    }
  }

  const handleConnectToMeeting = (meeting: Meeting) => {
    if (meeting.meeting_link) {
      window.open(meeting.meeting_link, "_blank")
      toast({
        title: "Opening Meeting",
        description: `Opening meeting with ${meeting.client_id?.first_name} ${meeting.client_id?.last_name}`,
      })
    } else {
      toast({
        title: "No Meeting Link",
        description: "Meeting link is not available",
        variant: "destructive",
      })
    }
  }

  const handleCloseMeeting = async (meetingId: string) => {
    try {
      setUpdatingMeeting(meetingId)
      const response = await updateMeetingStatus(meetingId, "completed")
      if (response.success) {
        // Update local state
        setMeetings((prev) =>
          prev.map((meeting) => (meeting._id === meetingId ? { ...meeting, status: "completed" as const } : meeting)),
        )
        setFilteredMeetings((prev) =>
          prev.map((meeting) => (meeting._id === meetingId ? { ...meeting, status: "completed" as const } : meeting)),
        )
        toast({
          title: "Meeting Closed",
          description: "Meeting has been marked as completed",
        })
      } else {
        throw new Error(response.message || "Failed to close meeting")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to close meeting",
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
        // Update local state
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
          title: "Meeting Approved",
          description: "Meeting has been approved and meeting link has been generated",
        })
      } else {
        throw new Error(response.message || "Failed to approve meeting")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to approve meeting",
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
        // Update local state
        setMeetings((prev) =>
          prev.map((meeting) => (meeting._id === meetingId ? { ...meeting, status: "rejected" as const } : meeting)),
        )
        setFilteredMeetings((prev) =>
          prev.map((meeting) => (meeting._id === meetingId ? { ...meeting, status: "rejected" as const } : meeting)),
        )
        toast({
          title: "Meeting Rejected",
          description: "Meeting has been rejected",
        })
      } else {
        throw new Error(response.message || "Failed to reject meeting")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reject meeting",
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
    setFilteredMeetings((prev) =>
      prev.map((meeting) => (meeting._id === updatedMeeting._id ? updatedMeeting : meeting))
    )
    
    toast({
      title: "Meeting Updated",
      description: "Meeting has been updated successfully",
    })
  }

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false)
    setEditingMeeting(null)
  }

  const formatScheduledTime = (meeting: Meeting) => {
    if (meeting.date && meeting.time) {
      // Combine date and time for better display
      const dateStr = new Date(meeting.date).toLocaleDateString()
      return `${dateStr} at ${meeting.time}`
    } else if (meeting.createdAt) {
      return formatDate(meeting.createdAt, true)
    }
    return "Not scheduled"
  }

  const getClientName = (meeting: Meeting) => {
    if (meeting.client_id && typeof meeting.client_id === 'object') {
      return `${meeting.client_id.first_name || ''} ${meeting.client_id.last_name || ''}`.trim() || "Unknown Client"
    }
    return "Unknown Client"
  }

  const getLawyerName = (meeting: Meeting) => {
    if (meeting.lawyer_id && typeof meeting.lawyer_id === 'object') {
      return `${meeting.lawyer_id.first_name || ''} ${meeting.lawyer_id.last_name || ''}`.trim() || "Unknown Lawyer"
    }
    return "Unknown Lawyer"
  }

  const getLawyerCharges = (meeting: Meeting) => {
    // Priority: Custom Rate > Default Lawyer Rate > Free
    if (meeting.consultation_type === 'free') {
      return 'Free'
    }
    
    if (meeting.custom_fee && meeting.hourly_rate !== undefined) {
      return `$${meeting.hourly_rate} (Custom)`
    }
    
    if (meeting.lawyer_id && typeof meeting.lawyer_id === 'object' && meeting.lawyer_id.charges) {
      return `$${meeting.lawyer_id.charges}`
    }
    
    return '$0'
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
                      placeholder="Search consultations..."
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
                <TableHead className="min-w-[120px]">Client Name</TableHead>
                <TableHead className="min-w-[120px]">Lawyer Name</TableHead>
                <TableHead className="min-w-[120px]">Rate & Type</TableHead>
                <TableHead className="min-w-[180px]">Scheduled Time</TableHead>
                <TableHead className="min-w-[100px]">Status</TableHead>
                <TableHead className="min-w-[200px]">Meeting Link</TableHead>
                <TableHead className="min-w-[300px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex items-center justify-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-gray-500">Loading meetings...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredMeetings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    <div className="flex flex-col items-center space-y-2">
                      <Calendar className="h-8 w-8 text-gray-400" />
                      <span>No meetings found</span>
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
                          {getLawyerCharges(meeting) === 'Free' ? (
                            <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                              Free
                            </span>
                          ) : (
                            <>
                              <DollarSign className="h-3 w-3 text-green-600" />
                              <span className="text-sm font-medium text-green-600">
                                {getLawyerCharges(meeting)}
                              </span>
                            </>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {meeting.consultation_type === 'free' ? 'Free Consultation' : 'Paid Consultation'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="min-w-[180px]">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-1 text-sm">
                          <Clock className="h-3 w-3 text-gray-400" />
                          <span>{formatScheduledTime(meeting)}</span>
                        </div>
                        {(meeting.title || meeting.meeting_title) && (
                          <div className="text-xs text-gray-500 truncate max-w-[160px]">
                            {meeting.title || meeting.meeting_title}
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
                        <span className="text-xs text-gray-500">No link available</span>
                      )}
                    </TableCell>
                    <TableCell className="min-w-[300px]">
                      <div className="flex gap-1 flex-wrap">
                        {/* Edit button for pending/approved meetings */}
                        {(meeting.status === "pending_approval" || meeting.status === "approved") && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-gray-600 hover:text-gray-700 hover:bg-gray-50 text-xs px-2 py-1"
                            onClick={() => handleEditMeeting(meeting)}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                        )}
                        
                        {/* Approve/Reject buttons for pending meetings */}
                        {(meeting.status === "pending" || meeting.status === "pending_approval") && (
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
                              Approve
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
                              Reject
                            </Button>
                          </>
                        )}
                        
                        {/* Connect button for approved meetings with links */}
                        {(meeting.status === "approved" || meeting.status === "active") && meeting.meeting_link && (
                          <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1"
                            onClick={() => handleConnectToMeeting(meeting)}
                          >
                            <Video className="h-3 w-3 mr-1" />
                            Connect
                          </Button>
                        )}
                        
                        {/* Close button for active meetings */}
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
                            Close
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
      
      {/* Edit Meeting Modal */}
      <EditMeetingModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        meeting={editingMeeting}
        onMeetingUpdated={handleMeetingUpdated}
      />
    </div>
  )
}
