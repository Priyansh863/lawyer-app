"use client"

import type { Case } from "@/types/case"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import { updateCaseStatus } from "@/lib/api/cases-api"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/hooks/useTranslation"

interface CaseDetailsProps {
  caseData: Case
}

export default function CaseDetails({ caseData }: CaseDetailsProps) {
  const [caseState, setCaseState] = useState<Case>(caseData)
  const [isUpdating, setIsUpdating] = useState(false)
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

  const handleStatusUpdate = async (newStatus: "approved" | "rejected" | "pending") => {
    setIsUpdating(true)
    try {
      await updateCaseStatus(caseState._id, newStatus)
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
    } finally {
      setIsUpdating(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusKey = status.toLowerCase() as "pending" | "approved" | "rejected"
    let colorClasses =
      statusKey === "pending"
        ? "bg-yellow-50 text-yellow-600 border-yellow-200"
        : statusKey === "approved"
        ? "bg-green-50 text-green-600 border-green-200"
        : "bg-red-50 text-red-600 border-red-200"

    return (
      <Badge variant="outline" className={colorClasses}>
        {t(`pages:caseDetails.status.${statusKey}`)}
      </Badge>
    )
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

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            {getStatusBadge(caseState.status)}
            {caseState.status === "pending" && (
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-green-600"
                  onClick={() => handleStatusUpdate("approved")}
                  disabled={isUpdating}
                >
                  {t("pages:caseDetails.approve")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600"
                  onClick={() => handleStatusUpdate("rejected")}
                  disabled={isUpdating}
                >
                  {t("pages:caseDetails.reject")}
                </Button>
              </div>
            )}
          </div>
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

            {/* Added: Status Label */}
            <div>
              <h3 className="text-sm font-medium text-gray-500">
                {t("pages:caseDetails.statusLabel", "Status")}
              </h3>
              <p>{t(`pages:caseDetails.status.${caseState.status.toLowerCase()}`)}</p>
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
                {caseState.key_points.map((point, index) => (
                  <li key={index} className="text-sm">
                    {translateEmbeddedText(point)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
