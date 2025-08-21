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
import { MessageCircle, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useSelector } from 'react-redux'
import { RootState } from '@/lib/store'
import TokenBalanceDisplay from './token-balance-display'

interface ChatConsultationDialogProps {
  lawyerId: string
  lawyerName: string
  onChatCreated?: (chatId: string) => void
  children?: React.ReactNode
}

export default function ChatConsultationDialog({
  lawyerId,
  lawyerName,
  onChatCreated,
  children
}: ChatConsultationDialogProps) {
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const { toast } = useToast()
  const profile = useSelector((state: RootState) => state.auth.user)

  const getToken = () => {
    if (typeof window !== "undefined") {
      const user = localStorage.getItem("user")
      return user ? JSON.parse(user).token : null
    }
    return null
  }

  const createChat = async () => {
    setCreating(true)
    try {
      const token = getToken()
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chat/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          participantId: lawyerId
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: 'Chat Started',
          description: data.message || 'Chat consultation started successfully',
        })
        
        if (onChatCreated) {
          onChatCreated(data.data._id)
        }
        
        setOpen(false)
      } else {
        throw new Error(data.message || 'Failed to start chat')
      }
    } catch (error: any) {
      console.error('Error creating chat:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to start chat consultation',
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Start Chat
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Start Chat Consultation
          </DialogTitle>
          <DialogDescription>
            Review the consultation details and your token balance before starting the chat with {lawyerName}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <TokenBalanceDisplay
            lawyerId={lawyerId}
            lawyerName={lawyerName}
            consultationType="chat"
            onProceed={createChat}
            showProceedButton={true}
          />
          
          {creating && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Starting chat consultation...</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
