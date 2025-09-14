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
      .replace(/Status:/gi, t("pages:caseDetailsq.statusLabel"))
      .replace(/\bapproved\b/gi, t("pages:caseDetailsq.status.approved"))
      .replace(/\bpending\b/gi, t("pages:caseDetailsq.status.pending"))
      .replace(/\brejected\b/gi, t("pages:caseDetailsq.status.rejected"))
      .replace(/Created by:/gi, t("pages:caseDetailsq.createdByLabel"))
      .replace(/Created at:/gi, t("pages:caseDetailsq.createdAtLabel"))
  }

  const handleStatusUpdate = async (newStatus: CaseStatus) => {
    try {
      await updateCaseStatus(caseState._id as string, newStatus)
      setCaseState({ ...caseState, status: newStatus })
      toast({
        title: t("pages:caseDetailsq.statusUpdated"),
        description: t("pages:caseDetailsq.caseHasBeen", {
          status: t(`pages:caseDetailsq.status.${newStatus}`),
        }),
      })
    } catch (error) {
      toast({
        title: t("pages:caseDetailsq.error"),
        description: t("pages:caseDetailsq.failedToUpdate"),
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const statusKey = status.toLowerCase()
    // Treat "open" status as "pending" for display purposes
    const displayStatus = statusKey === "open" ? "pending" : statusKey
    let colorClasses = ""

    // Judgment Outcomes (판결 종국)
    if (["full_win", "partial_win"].includes(displayStatus)) {
      colorClasses = "bg-green-50 text-green-600 border-green-200"
    } else if (["full_loss", "partial_loss", "dismissal"].includes(displayStatus)) {
      colorClasses = "bg-red-50 text-red-600 border-red-200"
    } else if (displayStatus === "rejection") {
      colorClasses = "bg-gray-50 text-gray-600 border-gray-200"
    }
    // Non-Judgment Outcomes (판결 외 종국)
    else if (["withdrawal", "mediation", "settlement"].includes(displayStatus)) {
      colorClasses = "bg-blue-50 text-blue-600 border-blue-200"
    } else if (["trial_cancellation", "suspension", "closure"].includes(displayStatus)) {
      colorClasses = "bg-orange-50 text-orange-600 border-orange-200"
    }
    // Active case statuses
    else if (displayStatus === "in_progress") {
      colorClasses = "bg-indigo-50 text-indigo-600 border-indigo-200"
    } else if (displayStatus === "pending") {
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

  const getStatusLabel = (status: string) => {
    const statusKey = status.toLowerCase()
    // Treat "open" status as "pending" for display purposes
    const displayStatus = statusKey === "open" ? "pending" : statusKey
    
    const statusLabels: Record<string, string> = {
      // Basic statuses
      approved: t("pages:caseDetailsq.status.approved"),
      pending: t("pages:caseDetailsq.status.pending"),
      rejected: t("pages:caseDetailsq.status.rejected"),
      // Judgment Outcomes (판결 종국)
      full_win: t("pages:caseDetailsq.status.full_win"),
      full_loss: t("pages:caseDetailsq.status.full_loss"),
      partial_win: t("pages:caseDetailsq.status.partial_win"),
      partial_loss: t("pages:caseDetailsq.status.partial_loss"),
      dismissal: t("pages:caseDetailsq.status.dismissal"),
      rejection: t("pages:caseDetailsq.status.rejection"),
      // Non-Judgment Outcomes (판결 외 종국)
      withdrawal: t("pages:caseDetailsq.status.withdrawal"),
      mediation: t("pages:caseDetailsq.status.mediation"),
      settlement: t("pages:caseDetailsq.status.settlement"),
      trial_cancellation: t("pages:caseDetailsq.status.trial_cancellation"),
      suspension: t("pages:caseDetailsq.status.suspension"),
      closure: t("pages:caseDetailsq.status.closure"),
      // Active case statuses
      in_progress: t("pages:caseDetailsq.status.in_progress"),
      open: t("pages:caseDetailsq.status.pending"), // Map "open" to "pending" translation
    }
    return statusLabels[displayStatus] || displayStatus.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())
  }

  const getStatusDescription = (status: string) => {
    const statusKey = status.toLowerCase()
    // Treat "open" status as "pending" for display purposes
    const displayStatus = statusKey === "open" ? "pending" : statusKey
    
    const descriptions: Record<string, string> = {
      // Basic statuses
      approved: t("pages:caseDetailsq.statusDescriptions.approved"),
      pending: t("pages:caseDetailsq.statusDescriptions.pending"),
      rejected: t("pages:caseDetailsq.statusDescriptions.rejected"),
      // Judgment Outcomes
      full_win: t("pages:caseDetailsq.statusDescriptions.full_win"),
      full_loss: t("pages:caseDetailsq.statusDescriptions.full_loss"),
      partial_win: t("pages:caseDetailsq.statusDescriptions.partial_win"),
      partial_loss: t("pages:caseDetailsq.statusDescriptions.partial_loss"),
      dismissal: t("pages:caseDetailsq.statusDescriptions.dismissal"),
      rejection: t("pages:caseDetailsq.statusDescriptions.rejection"),
      // Non-Judgment Outcomes
      withdrawal: t("pages:caseDetailsq.statusDescriptions.withdrawal"),
      mediation: t("pages:caseDetailsq.statusDescriptions.mediation"),
      settlement: t("pages:caseDetailsq.statusDescriptions.settlement"),
      trial_cancellation: t("pages:caseDetailsq.statusDescriptions.trial_cancellation"),
      suspension: t("pages:caseDetailsq.statusDescriptions.suspension"),
      closure: t("pages:caseDetailsq.statusDescriptions.closure"),
      // Active statuses
      in_progress: t("pages:caseDetailsq.statusDescriptions.in_progress"),
      open: t("pages:caseDetailsq.statusDescriptions.pending"), // Map "open" to "pending" description
    }
    return descriptions[displayStatus] || t("pages:caseDetailsq.statusDescriptions.notAvailable")
  }

  return (
    <div className="space-y-6 px-4 md:px-0">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mt-10">
        <h1 className="text-2xl font-bold">{t("pages:caseDetailsq.title")}</h1>
        <Button variant="outline" onClick={() => router.back()}>
          {t("pages:caseDetailsq.backToCases")}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">{t("pages:caseDetailsq.caseNumber")}</p>
                <p className="text-lg font-bold text-blue-900 font-mono">{caseState.case_number}</p>
              </div>
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">#</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">{t("pages:caseDetailsq.statuse")}</p>
                <div className="mt-1">{getStatusBadge(caseState.status)}</div>
              </div>
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">✓</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">{t("pages:caseDetailsq.courtType")}</p>
                <p className="text-sm font-semibold text-purple-900">
                  {caseState.court_type ? t(`pages:casesD.courtTypes.${caseState.court_type}`) : t("common:na")}
                </p>
              </div>
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">⚖</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">{t("pages:caseDetailsq.caseType")}</p>
                <p className="text-sm font-semibold text-orange-900">
                  {caseState.case_type ? t(`pages:cases.caseTypes.${caseState.case_type}`) : t("common:na")}
                </p>
              </div>
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">📋</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: Basic Information */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              {t("pages:caseDetailsq.basicInfo")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">{t("pages:caseDetailsq.caseTitle")}</h3>
              <p className="text-base font-medium mt-1">{caseState.title}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">{t("pages:caseDetailsq.client")}</h3>
              <p className="text-base font-medium mt-1">
                {caseState.client_id
                  ? `${caseState.client_id.first_name} ${caseState.client_id.last_name || ""}`.trim()
                  : caseState.clientName || t("pages:commonl:na")}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">{t("pages:caseDetailsq.lawyer")}</h3>
              <p className="text-base font-medium mt-1">
                {caseState.lawyer_id
                  ? `${caseState.lawyer_id.first_name} ${caseState.lawyer_id.last_name || ""}`.trim()
                  : t("pages:commonl:na")}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">{t("pages:caseDetailsq.created")}</h3>
              <p className="mt-1">{formatDate(caseState.created_at)}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">{t("pages:caseDetailsq.lastUpdated")}</h3>
              <p className="mt-1">{formatDate(caseState.updated_at)}</p>
            </div>

            {caseState.createdBy && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  {t("pages:caseDetailsq.createdByLabel")}
                </h3>
                <p className="mt-1">{caseState.createdBy}</p>
              </div>
            )}

            {caseState.createdAt && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  {t("pages:caseDetailsq.createdAtLabel")}
                </h3>
                <p className="mt-1">{formatDate(caseState.createdAt)}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card 2: Case Details & Status */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              {t("pages:caseDetailsq.caseDetailsAndStatus")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">{t("pages:caseDetailsq.caseStatus")}</h3>
              <div className="flex flex-col gap-2 mt-1">
                {getStatusBadge(caseState.status)}
                <span className="text-sm text-gray-600">{getStatusDescription(caseState.status)}</span>
              </div>
            </div>

            {caseState.description && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">{t("pages:caseDetailsq.description")}</h3>
                <p className="mt-1 text-sm leading-relaxed">{translateEmbeddedText(caseState.description)}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card 3: Key Points & Additional Info */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
              {t("pages:caseDetailsq.keyPointsAndDetails")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {caseState.key_points?.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">{t("pages:caseDetailsq.keyPoints")}</h3>
                <ul className="mt-2 space-y-2">
                  {caseState.key_points.map((point: string, index: number) => (
                    <li key={index} className="text-sm flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
                      <span className="leading-relaxed">{translateEmbeddedText(point)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="pt-4 border-t">
              <h3 className="text-sm font-medium text-gray-500 mb-3">{t("pages:caseDetailsq.caseClassification")}</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{t("pages:caseDetailsq.caseType")}:</span>
                  <span className="px-2 py-1 rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-200">
                    {caseState.case_type ? t(`pages:cases.caseTypes.${caseState.case_type}`) : t("common:na")}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{t("pages:caseDetailsq.courtType")}:</span>
                  <span className="px-2 py-1 rounded-full text-xs bg-purple-50 text-purple-700 border border-purple-200">
                    {caseState.court_type ? t(`pages:casesD.courtTypes.${caseState.court_type}`) : t("common:na")}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Case Documents Section */}
      <CaseDocuments caseId={caseState._id} caseTitle={caseState.title} />
    </div>
  )
}