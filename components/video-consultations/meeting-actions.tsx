'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Check, X, Loader2 } from 'lucide-react'
import { approveMeeting, rejectMeeting } from '@/lib/api/meeting-api'
import { useToast } from '@/hooks/use-toast'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface MeetingActionsProps {
  meetingId: string
  status: string
  onStatusChange: (status: string) => void
  isLawyer: boolean
  currentUserId: string
  meetingLawyerId: string
}

export function MeetingActions({ 
  meetingId, 
  status, 
  onStatusChange, 
  isLawyer, 
  currentUserId,
  meetingLawyerId 
}: MeetingActionsProps) {
  const { toast } = useToast()
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')

  const handleApprove = async () => {
    if (!isLawyer) return
    
    setIsLoading(true)
    try {
      const result = await approveMeeting(meetingId)
      if (result.success) {
        onStatusChange('approved')
        toast({
          title: t('common:success'),
          description: t('meeting:meetingApproved'),
        })
      } else {
        throw new Error(result.message || 'Failed to approve meeting')
      }
    } catch (error: any) {
      toast({
        title: t('common:error'),
        description: error.message || t('common:somethingWentWrong'),
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleReject = async () => {
    if (!isLawyer) return
    
    setIsLoading(true)
    try {
      const result = await rejectMeeting(meetingId, rejectionReason)
      if (result.success) {
        onStatusChange('rejected')
        toast({
          title: t('common:success'),
          description: t('meeting:meetingRejected'),
        })
        setShowRejectDialog(false)
        setRejectionReason('')
      } else {
        throw new Error(result.message || 'Failed to reject meeting')
      }
    } catch (error: any) {
      toast({
        title: t('common:error'),
        description: error.message || t('common:somethingWentWrong'),
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Debug log to help diagnose visibility issues
  const showActions = status === 'pending' && isLawyer && currentUserId && meetingLawyerId && currentUserId === meetingLawyerId
  
  console.log('MeetingActions debug:', {
    status,
    isLawyer,
    currentUserId,
    meetingLawyerId,
    showActions,
    condition: {
      isPending: status === 'pending',
      isUserLawyer: isLawyer,
      hasCurrentUser: !!currentUserId,
      hasMeetingLawyer: !!meetingLawyerId,
      isAssignedLawyer: currentUserId === meetingLawyerId
    }
  })
  
  if (!showActions) {
    return (
      <div className="text-sm text-muted-foreground">
        {t(`meeting:status.${status}`, status)}
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-2">
      <Button
        variant="outline"
        size="sm"
        className="h-8 gap-1 text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
        onClick={handleApprove}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Check className="h-4 w-4" />
        )}
        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
          {t('common:approve')}
        </span>
      </Button>

      <Button
        variant="outline"
        size="sm"
        className="h-8 gap-1 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
        onClick={() => setShowRejectDialog(true)}
        disabled={isLoading}
      >
        <X className="h-4 w-4" />
        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
          {t('common:reject')}
        </span>
      </Button>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('meeting:rejectMeeting')}</DialogTitle>
            <DialogDescription>
              {t('meeting:rejectMeetingDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="reason">{t('meeting:reasonForRejection')}</Label>
              <Input
                id="reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder={t('meeting:enterReason')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRejectDialog(false)}
              disabled={isLoading}
            >
              {t('common:cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isLoading || !rejectionReason.trim()}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {t('common:confirmReject')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
