"use client"

import { useState } from "react"
import DashboardLayout from "@/components/layouts/dashboard-layout"
import { DocumentsHeader } from "@/components/documents/documents-header"
import DocumentsTable from "@/components/documents/documents-table"
import { useTranslation } from "@/hooks/useTranslation"

// import the voice summary components you already have
import VoiceSummaryLayout from "@/components/layouts/voice-summary-layout"
import VoiceSummaryHeader from "@/components/voice-summary/voice-summary-header"
import DocumentSummaryList from "@/components/voice-summary/document-summary-list"

export default function DocumentsPage() {
  const { t } = useTranslation()
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [activeTab, setActiveTab] = useState<"documents" | "voice">("documents")

  const handleDocumentUploaded = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        
        {/* Tabs */}
        <div className="flex gap-6 border-b pb-2">
          <button
            onClick={() => setActiveTab("documents")}
            className={`pb-2 ${
              activeTab === "documents"
                ? "border-b-2 border-blue-500 font-semibold"
                : "text-gray-500"
            }`}
          >
            {t("pages:document.doc")}
          </button>
          <button
            onClick={() => setActiveTab("voice")}
            className={`pb-2 ${
              activeTab === "voice"
                ? "border-b-2 border-blue-500 font-semibold"
                : "text-gray-500"
            }`}
          >
            {t("pages:document.vs")}
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "documents" && (
          <>
            <DocumentsHeader onDocumentUploaded={handleDocumentUploaded} />
            <DocumentsTable
              refreshTrigger={refreshTrigger}
              onDocumentUpdate={handleDocumentUploaded}
            />
          </>
        )}

        {activeTab === "voice" && (
          <VoiceSummaryLayout>
            <div className="flex flex-col gap-6 mt-5">
              <VoiceSummaryHeader />
              <DocumentSummaryList initialSummaries={[]} />
            </div>
          </VoiceSummaryLayout>
        )}
      </div>
    </DashboardLayout>
  )
}