"use client"
import VoiceSummaryLayout from "@/components/layouts/voice-summary-layout"
import VoiceSummaryHeader from "@/components/voice-summary/voice-summary-header"
import DocumentSummaryList from "@/components/voice-summary/document-summary-list"

export default function VoiceSummaryPage() {
  return (
    <VoiceSummaryLayout>
      <div className="flex flex-col gap-6 mt-5">
        <VoiceSummaryHeader />
        <DocumentSummaryList initialSummaries={[]} />
      </div>
    </VoiceSummaryLayout>
  )
}
