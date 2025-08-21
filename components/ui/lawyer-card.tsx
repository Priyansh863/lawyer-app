'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MessageCircle, Video, Star, MapPin, Briefcase, Coins } from 'lucide-react'
import { useSelector } from 'react-redux'
import { RootState } from '@/lib/store'
import ChatConsultationDialog from './chat-consultation-dialog'
import VideoConsultationDialog from './video-consultation-dialog'

interface LawyerCardProps {
  lawyer: {
    _id: string
    first_name: string
    last_name: string
    email: string
    profile_image?: string
    pratice_area?: string
    experience?: string
    charges?: number
  }
  onChatCreated?: (chatId: string) => void
  onMeetingCreated?: (meetingId: string) => void
  showActions?: boolean
}

export default function LawyerCard({ 
  lawyer, 
  onChatCreated, 
  onMeetingCreated,
  showActions = true 
}: LawyerCardProps) {
  const profile = useSelector((state: RootState) => state.auth.user)
  const isClient = profile?.account_type === 'client'

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase()
  }

  const formatExperience = (experience: string) => {
    const expMap: Record<string, string> = {
      '1': '1-2 years',
      '3': '3-5 years', 
      '6': '6-9 years',
      '10': '10+ years'
    }
    return expMap[experience] || experience
  }

  const formatPracticeArea = (area: string) => {
    const areaMap: Record<string, string> = {
      'corporate': 'Corporate Law',
      'family': 'Family Law',
      'criminal': 'Criminal Law',
      'immigration': 'Immigration Law',
      'intellectual': 'Intellectual Property',
      'real-estate': 'Real Estate Law'
    }
    return areaMap[area] || area
  }

  const lawyerName = `${lawyer.first_name} ${lawyer.last_name}`
  const consultationCost = lawyer.charges || 0

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={lawyer.profile_image} alt={lawyerName} />
            <AvatarFallback className="text-lg">
              {getInitials(lawyer.first_name, lawyer.last_name)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-2">
            <div>
              <CardTitle className="text-xl">{lawyerName}</CardTitle>
              <CardDescription className="flex items-center gap-1">
                <span>{lawyer.email}</span>
              </CardDescription>
            </div>

            <div className="flex flex-wrap gap-2">
              {lawyer.pratice_area && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Briefcase className="h-3 w-3" />
                  {formatPracticeArea(lawyer.pratice_area)}
                </Badge>
              )}
              
              {lawyer.experience && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  {formatExperience(lawyer.experience)}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Consultation Cost */}
        <div className="bg-muted/50 p-3 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Consultation Rate:</span>
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-muted-foreground" />
              <Badge variant={consultationCost === 0 ? "secondary" : "default"}>
                {consultationCost === 0 ? 'FREE' : `${consultationCost} tokens`}
              </Badge>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Per consultation session (chat or video)
          </p>
        </div>

        {/* Action Buttons - Only show for clients */}
        {isClient && showActions && (
          <div className="flex gap-2">
            <ChatConsultationDialog
              lawyerId={lawyer._id}
              lawyerName={lawyerName}
              onChatCreated={onChatCreated}
            >
              <Button className="flex-1 flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Start Chat
              </Button>
            </ChatConsultationDialog>

            <VideoConsultationDialog
              lawyerId={lawyer._id}
              lawyerName={lawyerName}
              onMeetingCreated={onMeetingCreated}
            >
              <Button variant="outline" className="flex-1 flex items-center gap-2">
                <Video className="h-4 w-4" />
                Schedule Video
              </Button>
            </VideoConsultationDialog>
          </div>
        )}

        {/* Info for lawyers viewing other lawyers */}
        {!isClient && (
          <div className="text-center py-2">
            <p className="text-sm text-muted-foreground">
              Consultation options available for clients
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
