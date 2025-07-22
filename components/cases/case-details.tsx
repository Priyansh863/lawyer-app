"use client"

import type { Case } from "@/types/case"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import { updateCaseStatus } from "@/lib/api/cases-api"
import { useToast } from "@/hooks/use-toast"
import CaseFiles from "@/components/cases/case-files"
import CaseSummary from "@/components/cases/case-summary"
import CaseNotes from "@/components/cases/case-notes"

interface CaseDetailsProps {
  caseData: Case
}

export default function CaseDetails({ caseData }: CaseDetailsProps) {
  const [caseState, setCaseState] = useState<Case>(caseData)
  const [isUpdating, setIsUpdating] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  console.log(caseState,"caseStatecaseStatecaseState")

  const handleStatusUpdate = async (newStatus: "approved" | "rejected" | "pending") => {
    setIsUpdating(true)
    try {
      await updateCaseStatus(caseState._id, newStatus)
      setCaseState({ ...caseState, status: newStatus })
      toast({
        title: "Status updated",
        description: `Case has been ${newStatus}`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update case status",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-600 border-yellow-200">
            Pending
          </Badge>
        )
      case "approved":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
            Approved
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
            Rejected
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Case Details</h1>
        <Button variant="outline" onClick={() => router.back()}>
          Back to Cases
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Case #{caseState._id}</CardTitle>
          <div className="flex items-center gap-2">
            {getStatusBadge(caseState.status)}
            {caseState.status === "pending" && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-green-600"
                  onClick={() => handleStatusUpdate("approved")}
                  disabled={isUpdating}
                >
                  Approve
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600"
                  onClick={() => handleStatusUpdate("rejected")}
                  disabled={isUpdating}
                >
                  Reject
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Case Number</h3>
              <p className="text-lg font-medium font-mono">{caseState.case_number}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Case Title</h3>
              <p className="text-lg font-medium">{caseState.title}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Client</h3>
              <p className="text-lg font-medium">
                {caseState.client_id ? 
                  `${caseState.client_id.first_name} ${caseState.client_id.last_name || ''}`.trim() 
                  : caseState.clientName || 'N/A'
                }
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Lawyer</h3>
              <p className="text-lg font-medium">
                {caseState.lawyer_id ? 
                  `${caseState.lawyer_id.first_name} ${caseState.lawyer_id.last_name || ''}`.trim() 
                  : 'N/A'
                }
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Created</h3>
              <p>{formatDate(caseState.created_at)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Last Updated</h3>
              <p>{formatDate(caseState.updated_at)}</p>
            </div>
          </div>

          {caseState.description && (
            <div>
              <h3 className="text-sm font-medium text-gray-500">Description</h3>
              <p className="mt-1">{caseState.description}</p>
            </div>
          )}

          {caseState.summary && (
            <div>
              <h3 className="text-sm font-medium text-gray-500">Summary</h3>
              <p className="mt-1">{caseState.summary}</p>
            </div>
          )}

          {caseState.key_points && caseState.key_points.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-500">Key Points</h3>
              <ul className="mt-1 list-disc list-inside space-y-1">
                {caseState.key_points.map((point, index) => (
                  <li key={index} className="text-sm">{point}</li>
                ))}
              </ul>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  )
}
