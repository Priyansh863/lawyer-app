"use client"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { downloadSummary } from "@/lib/api/voice-summary-api"
import { useSelector } from "react-redux"
import { getGreeting } from "@/lib/helpers/greeting"
import { RootState } from "@/lib/store"

export default  function VoiceSummaryHeader() {
  const user = useSelector((state: RootState) => state.auth.user)

  // Get greeting based on time of day


  return (
    <div className="flex justify-between items-center">
      <h1 className="text-2xl font-bold tracking-tight">
        {/* {getGreeting()}, {user?.first_name+ " " + user?.last_name || "User"}! */}
      </h1>
      <form
        action={async () => {
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
