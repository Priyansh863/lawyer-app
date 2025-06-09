import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare, Video, FileText, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"

interface ActivityItemProps {
  icon: React.ReactNode
  title: string
  description: string
  time: string
  iconColor?: string
}

function ActivityItem({ icon, title, description, time, iconColor = "bg-gray-100" }: ActivityItemProps) {
  return (
    <div className="flex items-start gap-4 py-3">
      <div className={cn("p-2 rounded-md", iconColor)}>{icon}</div>
      <div className="flex-1 space-y-1">
        <p className="font-medium">{title}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <div className="text-xs text-gray-400">{time}</div>
    </div>
  )
}

export default function RecentActivity() {
  // these would come from an API
  const activities = [
    {
      icon: <MessageSquare size={16} />,
      title: "New chat message",
      description: "Client John Doe sent you a message",
      time: "10m ago",
      iconColor: "bg-blue-100 text-blue-600",
    },
    {
      icon: <Video size={16} />,
      title: "Video consultation",
      description: "Completed consultation with Sarah Smith",
      time: "1h ago",
      iconColor: "bg-purple-100 text-purple-600",
    },
    {
      icon: <FileText size={16} />,
      title: "Document uploaded",
      description: "Contract for case #1234 uploaded",
      time: "3h ago",
      iconColor: "bg-green-100 text-green-600",
    },
    {
      icon: <Calendar size={16} />,
      title: "Appointment scheduled",
      description: "Court hearing for Smith vs. Jones",
      time: "5h ago",
      iconColor: "bg-amber-100 text-amber-600",
    },
  ]

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-0 divide-y">
        {activities.map((activity, index) => (
          <ActivityItem
            key={index}
            icon={activity.icon}
            title={activity.title}
            description={activity.description}
            time={activity.time}
            iconColor={activity.iconColor}
          />
        ))}
      </CardContent>
    </Card>
  )
}
