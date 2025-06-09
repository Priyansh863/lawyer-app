import type React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { FileText, FileArchive, DollarSign, MessageSquare } from "lucide-react"

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
}

function StatCard({ title, value, icon }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gray-100 rounded-md">{icon}</div>
          <span className="text-sm font-medium text-gray-500">{title}</span>
        </div>
        <div className="mt-2 text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  )
}

export default function StatsCards() {
  
  const stats = [
    { title: "Active Cases", value: "24", icon: <FileText size={18} /> },
    { title: "Inactive Cases", value: "06", icon: <FileArchive size={18} /> },
    { title: "Earnings", value: "$120.00", icon: <DollarSign size={18} /> },
    { title: "Today's Chats", value: "12", icon: <MessageSquare size={18} /> },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <StatCard key={stat.title} title={stat.title} value={stat.value} icon={stat.icon} />
      ))}
    </div>
  )
}
