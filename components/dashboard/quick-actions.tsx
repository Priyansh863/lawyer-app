"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Plus } from "lucide-react"
import { useRouter } from "next/navigation"

export default function QuickActions() {
  const router = useRouter()

  const handleScheduleCall = () => {
    router.push('/video-consultations')
  }

  const handleNewCase = () => {
    router.push('/cases/new')
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          variant="outline" 
          className="w-full justify-start gap-2"
          onClick={handleScheduleCall}
        >
          <Calendar size={16} />
          Schedule Call
        </Button>

        <Button 
          variant="outline" 
          className="w-full justify-start gap-2"
          onClick={handleNewCase}
        >
          <Plus size={16} />
          New Case
        </Button>
      </CardContent>
    </Card>
  )
}
