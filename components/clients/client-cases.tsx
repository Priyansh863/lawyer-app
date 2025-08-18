"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Eye, Plus } from "lucide-react"
import { getClientCases } from "@/lib/api/cases-api"
import { formatDate } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import type { Case } from "@/types/case"
import { useTranslation } from "@/hooks/useTranslation"
import { useSelector } from "react-redux"
import { RootState } from "@/lib/store"

interface ClientCasesProps {
  clientId: string
}

export default function ClientCases({ clientId }: ClientCasesProps) {
  const [cases, setCases] = useState<Case[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useTranslation()
  const profile = useSelector((state: RootState) => state.auth.user)

  useEffect(() => {
    const loadCases = async () => {
      try {
        setIsLoading(true)
        const clientCases = await getClientCases(clientId, profile?.account_type === "lawyer" ? "client" : "lawyer")
        console.log("Fetched cases:", clientCases) // Debug log
        setCases(clientCases || [])
      } catch (error) {
        console.error("Error fetching client cases:", error)
        toast({
          title: t("pages:clientCases.error"),
          description: t("pages:clientCases.failedToLoad"),
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (clientId) {
      loadCases()
    }
  }, [clientId])

  const viewCaseDetails = (caseItem: Case) => {
    const caseData = encodeURIComponent(JSON.stringify(caseItem))
    console.log(caseItem, "caseItemcaseItemcaseItemcaseItemcaseItemcaseItem")
    router.push(`/cases/${caseItem._id}?data=${caseData}`)
  }

  const getStatusBadge = (status: string) => {
    const statusKey = status.toLowerCase()
    // Treat "open" status as "pending" for display purposes
    const displayStatus = statusKey === "open" ? "pending" : statusKey
    
    const badgeMap: Record<string, string> = {
      pending: "bg-yellow-50 text-yellow-600 border-yellow-200",
      approved: "bg-green-50 text-green-600 border-green-200",
      rejected: "bg-red-50 text-red-600 border-red-200",
      open: "bg-yellow-50 text-yellow-600 border-yellow-200", // Map "open" to same as "pending"
    }

    // Get the translation key - use "pending" for "open" status
    const translationKey = statusKey === "open" ? "pending" : statusKey

    return (
      <Badge variant="outline" className={badgeMap[displayStatus] || ""}>
        {t(`pages:caseDetails.status.${translationKey}`, status)}
      </Badge>
    )
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">{t("pages:clientCases.title")}</h3>
          {profile?.account_type === 'lawyer' && (
            <Button onClick={() => router.push(`/cases/new?clientId=${clientId}`)} className="bg-[#0f0921] hover:bg-[#0f0921]/90">
              {t("pages:cases.newCase")}
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            {t("pages:clientCases.loading")}
          </div>
        ) : cases.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {t("pages:clientCases.noCases")}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("pages:clientCases.caseNumber")}</TableHead>
                <TableHead>{t("pages:clientCases.titleColumn")}</TableHead>
                <TableHead>{t("pages:clientCases.statusf")}</TableHead>
                <TableHead>{t("pages:clientCases.description")}</TableHead>
                <TableHead>{t("pages:clientCases.created")}</TableHead>
                <TableHead>{t("pages:clientCases.updated")}</TableHead>
                <TableHead>{t("pages:clientCases.action")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cases.map((caseItem, index) => (
                <TableRow
                  key={caseItem.id}
                  className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}
                >
                  <TableCell className="font-medium">{caseItem.case_number}</TableCell>
                  <TableCell className="max-w-[200px] truncate" title={caseItem.title}>
                    {caseItem.title}
                  </TableCell>
                  <TableCell>{getStatusBadge(caseItem.status)}</TableCell>
                  <TableCell className="max-w-[300px] truncate" title={caseItem.description}>
                    {caseItem.description || t("pages:clientCases.noDescription")}
                  </TableCell>
                  <TableCell>{formatDate(caseItem.createdAt)}</TableCell>
                  <TableCell>{formatDate(caseItem.updatedAt)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => viewCaseDetails(caseItem)} className="h-8 w-8">
                      <Eye size={16} />
                      <span className="sr-only">{t("pages:clientCases.viewCase")}</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}