import React, { Suspense } from "react"
import CasesLayout from "@/components/layouts/cases-layout"
import CasesTable from "@/components/cases/cases-table"
import CasesHeader from "@/components/cases/cases-header"
import { getCases } from "@/lib/api/cases-api"

export default async function CasesPage() {
  const cases = await getCases({ status: "all" })

  return (
    <CasesLayout>
      <div className="flex flex-col gap-6">
        <CasesHeader />
        <Suspense fallback={<div>Loading cases...</div>}>
          <CasesTable initialCases={cases} />
        </Suspense>
      </div>
    </CasesLayout>
  )
}
