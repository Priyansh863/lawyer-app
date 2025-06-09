import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Calendar, Plus } from "lucide-react"
import { FileUploader } from "../file/file-uploader"

export default function QuickActions() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FileUploader />

        <Button variant="outline" className="w-full justify-start gap-2">
          <FileText size={16} />
          Write Blog
        </Button>

        <Button variant="outline" className="w-full justify-start gap-2">
          <Calendar size={16} />
          Schedule Call
        </Button>

        <Button variant="outline" className="w-full justify-start gap-2">
          <Plus size={16} />
          New Case
        </Button>
      </CardContent>
    </Card>
  )
}
