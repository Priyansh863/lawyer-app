import VoiceSummaryLayout from "@/components/layouts/voice-summary-layout"
import VoiceSummaryHeader from "@/components/voice-summary/voice-summary-header"
import DocumentSummaryList from "@/components/voice-summary/document-summary-list"
import { getDocumentSummaries } from "@/lib/api/voice-summary-api"

export default async function VoiceSummaryPage() {
  // Get document summaries for TTS playback
  const documentSummaries = await getDocumentSummaries()

  return (
    <VoiceSummaryLayout>
      <div className="flex flex-col gap-6">
        <VoiceSummaryHeader />
        <DocumentSummaryList initialSummaries={documentSummaries} />
      </div>
    </VoiceSummaryLayout>
  )
}
