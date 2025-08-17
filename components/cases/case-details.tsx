"use client"

import type { Case, CaseStatus } from "@/types/case"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import { updateCaseStatus } from "@/lib/api/cases-api"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/hooks/useTranslation"
import CaseDocuments from "./case-documents"

interface CaseDetailsProps {
  caseData: Case
}

export default function CaseDetails({ caseData }: CaseDetailsProps) {
  const [caseState, setCaseState] = useState<any>(caseData)
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useTranslation()

  /** Replace English summary/description labels & status with translations */
  const translateEmbeddedText = (text: string) => {
    if (!text) return text
    return text
      .replace(/Status:/gi, t("pages:caseDetails.statusLabel"))
      .replace(/\bapproved\b/gi, t("pages:caseDetails.status.approved"))
      .replace(/\bpending\b/gi, t("pages:caseDetails.status.pending"))
      .replace(/\brejected\b/gi, t("pages:caseDetails.status.rejected"))
      .replace(/Created by:/gi, t("pages:caseDetails.createdByLabel"))
      .replace(/Created at:/gi, t("pages:caseDetails.createdAtLabel"))
  }

  const handleStatusUpdate = async (newStatus: CaseStatus) => {
    try {
      await updateCaseStatus(caseState._id as string, newStatus)
      setCaseState({ ...caseState, status: newStatus })
      toast({
        title: t("pages:caseDetails.statusUpdated"),
        description: t("pages:caseDetails.caseHasBeen", {
          status: t(`pages:caseDetails.status.${newStatus}`)
        })
      })
    } catch (error) {
      toast({
        title: t("pages:caseDetails.error"),
        description: t("pages:caseDetails.failedToUpdate"),
        variant: "destructive"
      })
    } 
  }

  const getStatusBadge = (status: string) => {
    const statusKey = status.toLowerCase()
    let colorClasses = ""
    
    // Judgment Outcomes (판결 종국)
    if (["full_win", "partial_win"].includes(statusKey)) {
      colorClasses = "bg-green-50 text-green-600 border-green-200"
    } else if (["full_loss", "partial_loss", "dismissal"].includes(statusKey)) {
      colorClasses = "bg-red-50 text-red-600 border-red-200"
    } else if (statusKey === "rejection") {
      colorClasses = "bg-gray-50 text-gray-600 border-gray-200"
    }
    // Non-Judgment Outcomes (판결 외 종국)
    else if (["withdrawal", "mediation", "settlement"].includes(statusKey)) {
      colorClasses = "bg-blue-50 text-blue-600 border-blue-200"
    } else if (["trial_cancellation", "suspension", "closure"].includes(statusKey)) {
      colorClasses = "bg-orange-50 text-orange-600 border-orange-200"
    }
    // Active case statuses
    else if (statusKey === "in_progress") {
      colorClasses = "bg-indigo-50 text-indigo-600 border-indigo-200"
    } else if (statusKey === "pending") {
      colorClasses = "bg-yellow-50 text-yellow-600 border-yellow-200"
    } else {
      colorClasses = "bg-gray-50 text-gray-600 border-gray-200"
    }

    return (
      <Badge variant="outline" className={colorClasses}>
        {getStatusLabel(statusKey)}
      </Badge>
    )
  }


  console.log(caseState,"caseStatecaseStatecaseStatecaseStatecaseState")

  const getStatusLabel = (status: string) => {
    const statusLabels: Record<string, string> = {
      // Judgment Outcomes (판결 종국)
      "full_win": "전부 승소 (Full Win)",
      "full_loss": "전부 패소 (Full Loss)",
      "partial_win": "부분 승소 (Partial Win)", 
      "partial_loss": "부분 패소 (Partial Loss)",
      "dismissal": "기각 (Dismissal)",
      "rejection": "각하 (Rejection)",
      // Non-Judgment Outcomes (판결 외 종국)
      "withdrawal": "취하 (Withdrawal)",
      "mediation": "조정 (Mediation)",
      "settlement": "화해 (Settlement)",
      "trial_cancellation": "공판취소 (Trial Cancellation)",
      "suspension": "중지 (Suspension)",
      "closure": "종결 (Closure)",
      // Active case statuses
      "in_progress": "진행 중 (In Progress)",
      "pending": "대기 중 (Pending)"
    }
    return statusLabels[status] || status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const getStatusDescription = (status: string) => {
    const descriptions: Record<string, string> = {
      // Judgment Outcomes
      "full_win": "Complete victory in court proceedings",
      "full_loss": "Complete loss in court proceedings", 
      "partial_win": "Partial victory with some claims granted",
      "partial_loss": "Partial loss with some claims denied",
      "dismissal": "Case dismissed by court",
      "rejection": "Case rejected without merit review",
      // Non-Judgment Outcomes
      "withdrawal": "Case withdrawn by plaintiff",
      "mediation": "Resolved through court mediation",
      "settlement": "Settled out of court",
      "trial_cancellation": "Trial cancelled by court",
      "suspension": "Case proceedings suspended",
      "closure": "Case formally closed",
      // Active statuses
      "in_progress": "Case is actively being processed",
      "pending": "Case is waiting to begin",
      "open": "Case is open",
    }
    return descriptions[status.toLowerCase()] || "Status information not available"
  }

  return (
    <div className="space-y-6 px-4 md:px-0">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mt-10">
        <h1 className="text-2xl font-bold">{t("pages:caseDetails.Ctitle")}</h1>
        <Button variant="outline" onClick={() => router.back()}>
          {t("pages:caseDetails.backToCases")}
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <CardTitle className="text-lg sm:text-xl break-words w-full sm:w-auto">
            {t("pages:caseDetails.caseNumberWithId", { id: caseState._id })}
          </CardTitle>

        
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">
                {t("pages:caseDetails.caseNumber")}
              </h3>
              <p className="text-lg font-medium font-mono">{caseState.case_number}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">
                {t("pages:caseDetails.caseTitle")}
              </h3>
              <p className="text-lg font-medium">{caseState.title}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">
                {t("pages:caseDetails.client")}
              </h3>
              <p className="text-lg font-medium">
                {caseState.client_id
                  ? `${caseState.client_id.first_name} ${caseState.client_id.last_name || ""}`.trim()
                  : caseState.clientName || t("pages:caseDetails.na")}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">
                {t("pages:caseDetails.lawyer")}
              </h3>
              <p className="text-lg font-medium">
                {caseState.lawyer_id
                  ? `${caseState.lawyer_id.first_name} ${caseState.lawyer_id.last_name || ""}`.trim()
                  : t("pages:caseDetails.na")}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">
                {t("pages:caseDetails.created")}
              </h3>
              <p>{formatDate(caseState.created_at)}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">
                {t("pages:caseDetails.lastUpdated")}
              </h3>
              <p>{formatDate(caseState.updated_at)}</p>
            </div>

            {/* Case Type */}
            <div>
              <h3 className="text-sm font-medium text-gray-500">
                Case Type
              </h3>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-sm bg-blue-50 text-blue-700 border border-blue-200">
                  {caseState.case_type?.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'N/A'}
                </span>
              </div>
            </div>

            {/* Court Type */}
            <div>
              <h3 className="text-sm font-medium text-gray-500">
                Court Type
              </h3>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-sm bg-purple-50 text-purple-700 border border-purple-200">
                  {caseState.court_type?.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'N/A'}
                </span>
              </div>
            </div>

            {/* Enhanced Case Status */}
            <div>
              <h3 className="text-sm font-medium text-gray-500">
                Case Status
              </h3>
              <div className="flex items-center gap-2">
                {getStatusBadge(caseState.status)}
                <span className="text-sm text-gray-600">
                  {getStatusDescription(caseState.status)}
                </span>
              </div>
            </div>

            {/* Added: Created By */}
            {caseState.createdBy && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  {t("pages:caseDetails.createdByLabel", "Created by")}
                </h3>
                <p>{caseState.createdBy}</p>
              </div>
            )}

            {/* Added: Created At */}
            {caseState.createdAt && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  {t("pages:caseDetails.createdAtLabel", "Created at")}
                </h3>
                <p>{formatDate(caseState.createdAt)}</p>
              </div>
            )}
          </div>

          {caseState.description && (
            <div>
              <h3 className="text-sm font-medium text-gray-500">
                {t("pages:caseDetails.description")}
              </h3>
              <p className="mt-1">{translateEmbeddedText(caseState.description)}</p>
            </div>
          )}

          {caseState.summary && (
            <div>
              <h3 className="text-sm font-medium text-gray-500">
                {t("pages:caseDetails.summary")}
              </h3>
              <p className="mt-1">{translateEmbeddedText(caseState.summary)}</p>
            </div>
          )}

          {caseState.key_points?.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-500">
                {t("pages:caseDetails.keyPoints")}
              </h3>
              <ul className="mt-1 list-disc list-inside space-y-1">
                {caseState.key_points.map((point: string, index: number) => (
                  <li key={index} className="text-sm">
                    {translateEmbeddedText(point)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Case Documents Section */}
      <CaseDocuments caseId={caseState._id} caseTitle={caseState.title} />
    </div>
  )
}
