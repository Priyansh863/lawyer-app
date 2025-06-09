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

  const handleStatusUpdate = async (newStatus: "approved" | "rejected" | "pending") => {
    setIsUpdating(true)
    try {
      await updateCaseStatus(caseState.id, newStatus)
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
          <CardTitle>Case #{caseState.id}</CardTitle>
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
              <h3 className="text-sm font-medium text-gray-500">Case Title</h3>
              <p className="text-lg font-medium">{caseState.title}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Client</h3>
              <p className="text-lg font-medium">{caseState.clientName}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Created</h3>
              <p>{formatDate(caseState.createdAt)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Last Updated</h3>
              <p>{formatDate(caseState.updatedAt)}</p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Description</h3>
            <p className="mt-1">{caseState.description}</p>
          </div>

          <Tabs defaultValue="summary" className="mt-6">
            <TabsList>
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="files">Files</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>
            <TabsContent value="summary" className="mt-4">
              <CaseSummary caseId={caseState.id} />
            </TabsContent>
            <TabsContent value="files" className="mt-4">
              <CaseFiles caseId={caseState.id} />
            </TabsContent>
            <TabsContent value="notes" className="mt-4">
              <CaseNotes caseId={caseState.id} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
