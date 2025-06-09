import { getCurrentUser } from "@/lib/auth-utils"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { downloadSummary } from "@/lib/api/voice-summary-api"

export default async function VoiceSummaryHeader() {
  const user = await getCurrentUser()

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 18) return "Good afternoon"
    return "Good evening"
  }

  return (
    <div className="flex justify-between items-center">
      <h1 className="text-2xl font-bold tracking-tight">
        {getGreeting()}, {user.name}
      </h1>
      <form
        action={async () => {
          "use server"
          // In a real app, this would download the latest summary
          // or a combined summary of all recordings
          await downloadSummary("latest")
        }}
      >
        <Button type="submit" variant="default" className="bg-[#0f0921] hover:bg-[#0f0921]/90">
          <Download className="h-4 w-4 mr-2" />
          Download Summary
        </Button>
      </form>
    </div>
  )
}
