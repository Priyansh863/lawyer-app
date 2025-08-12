import { notFound } from "next/navigation"
import CasesLayout from "@/components/layouts/cases-layout"
import CaseDetails from "@/components/cases/case-details"
import { Case } from "@/types/case"

interface CasePageProps {
  params: Promise<{
    id: string
  }>
  searchParams: Promise<{
    data?: string
  }>
}

export default async function CasePage({ params, searchParams }: CasePageProps) {
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams
  let caseData: Case | null = null

  // Try to get case data from URL search params
  if (resolvedSearchParams.data) {
    try {
      caseData = JSON.parse(decodeURIComponent(resolvedSearchParams.data)) as Case
    } catch (error) {
      console.error("Failed to parse case data from URL:", error)
    }
  }

  // If no case data is available, show not found
  if (!caseData) {
    notFound()
  }

  return (
    <CasesLayout>
      <CaseDetails caseData={caseData} />
    </CasesLayout>
  )
}
