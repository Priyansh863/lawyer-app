import DashboardLayout from "@/components/layouts/dashboard-layout"
import { DocumentsHeader } from "@/components/documents/documents-header"
import { DocumentsTable } from "@/components/documents/documents-table"

export default function DocumentsPage() {
  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <DocumentsHeader />
        <DocumentsTable />
      </div>
    </DashboardLayout>
  )
}
