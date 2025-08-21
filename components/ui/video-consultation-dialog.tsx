'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Video, Loader2, Calendar } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useSelector } from 'react-redux'
import { RootState } from '@/lib/store'
import TokenBalanceDisplay from './token-balance-display'

interface VideoConsultationDialogProps {
  lawyerId: string
  lawyerName: string
  onMeetingCreated?: (meetingId: string) => void
  children?: React.ReactNode
}

export default function VideoConsultationDialog({
  lawyerId,
  lawyerName,
  onMeetingCreated,
  children
}: VideoConsultationDialogProps) {
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [meetingTitle, setMeetingTitle] = useState('')
  const [meetingDescription, setMeetingDescription] = useState('')
  const [requestedDate, setRequestedDate] = useState('')
  const [requestedTime, setRequestedTime] = useState('')
  const { toast } = useToast()
  const profile = useSelector((state: RootState) => state.auth.user)

  const getToken = () => {
    if (typeof window !== "undefined") {
      const user = localStorage.getItem("user")
      return user ? JSON.parse(user).token : null
    }
    return null
  }

  const createMeeting = async () => {
    if (!meetingTitle.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please enter a meeting title',
        variant: 'destructive'
      })
      return
    }

    if (!requestedDate || !requestedTime) {
      toast({
        title: 'Missing Information',
        description: 'Please select a date and time for the meeting',
        variant: 'destructive'
      })
      return
    }

    setCreating(true)
    try {
      const token = getToken()
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/meeting/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          clientId: profile?._id,
          lawyerId: lawyerId,
          meeting_title: meetingTitle,
          meeting_description: meetingDescription,
          requested_date: requestedDate,
          requested_time: requestedTime,
          meetingLink: '' // Will be set by the lawyer
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: 'Meeting Requested',
          description: data.message || 'Video consultation request sent successfully',
        })
        
        if (onMeetingCreated) {
          onMeetingCreated(data.data._id)
        }
        
        // Reset form
        setMeetingTitle('')
        setMeetingDescription('')
        setRequestedDate('')
        setRequestedTime('')
        setOpen(false)
      } else {
        throw new Error(data.message || 'Failed to create meeting request')
      }
    } catch (error: any) {
      console.error('Error creating meeting:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to request video consultation',
        variant: 'destructive'
      })
    } finally {
      setCreating(false)
    }
  }

  // Don't show for lawyers
  if (profile?.account_type === 'lawyer') {
    return null
  }

  // Set default date to tomorrow
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const defaultDate = tomorrow.toISOString().split('T')[0]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" className="flex items-center gap-2">
            <Video className="h-4 w-4" />
            Schedule Video Call
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Schedule Video Consultation
          </DialogTitle>
          <DialogDescription>
            Schedule a video consultation with {lawyerName}. Please review the consultation cost and your token balance.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Token Balance Display */}
          <TokenBalanceDisplay
            lawyerId={lawyerId}
            lawyerName={lawyerName}
            consultationType="video"
          />

          {/* Meeting Details Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="meeting-title">Meeting Title *</Label>
              <Input
                id="meeting-title"
                value={meetingTitle}
                onChange={(e) => setMeetingTitle(e.target.value)}
                placeholder="e.g., Legal Consultation - Contract Review"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="meeting-description">Meeting Description</Label>
              <Textarea
                id="meeting-description"
                value={meetingDescription}
                onChange={(e) => setMeetingDescription(e.target.value)}
                placeholder="Briefly describe what you'd like to discuss..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="requested-date">Preferred Date *</Label>
                <Input
                  id="requested-date"
                  type="date"
                  value={requestedDate}
                  onChange={(e) => setRequestedDate(e.target.value)}
                  min={defaultDate}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="requested-time">Preferred Time *</Label>
                <Input
                  id="requested-time"
                  type="time"
                  value={requestedTime}
                  onChange={(e) => setRequestedTime(e.target.value)}
                />
              </div>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium">Please note:</p>
                  <ul className="mt-1 space-y-1">
                    <li>• Your meeting request will be sent to the lawyer for approval</li>
                    <li>• Tokens will be deducted when the lawyer approves your request</li>
                    <li>• You'll receive a notification once the meeting is approved or declined</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
              disabled={creating}
            >
              Cancel
            </Button>
            <Button
              onClick={createMeeting}
              disabled={creating}
              className="flex-1"
            >
              {creating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending Request...
                </>
              ) : (
                'Send Meeting Request'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
