import { notFound } from "next/navigation"
import CasesLayout from "@/components/layouts/cases-layout"
import CaseDetails from "@/components/cases/case-details"
import { getCaseById } from "@/lib/api/cases-api"

interface CasePageProps {
  params: {
    id: string
  }
}

export default async function CasePage({ params }: CasePageProps) {
  const caseData = await getCaseById(params.id)

  if (!caseData) {
    notFound()
  }

  return (
    <CasesLayout>
      <CaseDetails caseData={caseData} />
    </CasesLayout>
  )
}
