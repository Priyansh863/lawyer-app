"use client"

import { useState } from "react"
import DashboardLayout from "@/components/layouts/dashboard-layout"
import { DocumentsHeader } from "@/components/documents/documents-header"
import DocumentsTable from "@/components/documents/documents-table"

export default function DocumentsPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleDocumentUploaded = () => {
    // Trigger refresh of documents table
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <DocumentsHeader onDocumentUploaded={handleDocumentUploaded} />
        <DocumentsTable key={refreshTrigger} onDocumentUploaded={handleDocumentUploaded} />
      </div>
    </DashboardLayout>
  )
}
