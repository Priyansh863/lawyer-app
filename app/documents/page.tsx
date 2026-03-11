"use client"

import DashboardLayout from "@/components/layouts/dashboard-layout"
import DocumentManager from "@/components/documents/document-manager"

export default function DocumentsPage() {
  return (
    <DashboardLayout>
      <div className="flex-1 p-4 md:p-8 pt-0 md:pt-0">
        <DocumentManager />
      </div>
    </DashboardLayout>
  )
}