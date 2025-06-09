"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Eye, Plus } from "lucide-react"
import { getClientCases } from "@/lib/api/clients-api"
import { formatDate } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import type { Case } from "@/types/case"

interface ClientCasesProps {
  clientId: string
}

export default function ClientCases({ clientId }: ClientCasesProps) {
  const [cases, setCases] = useState<Case[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const loadCases = async () => {
      try {
        setIsLoading(true)
        const clientCases = await getClientCases(clientId)
        setCases(clientCases)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load client cases",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadCases()
  }, [clientId, toast])

  // Get status badge
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
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Client Cases</h3>
          <Button size="sm" onClick={() => router.push(`/cases/new?clientId=${clientId}`)}>
            <Plus size={16} className="mr-2" />
            New Case
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading cases...</div>
        ) : cases.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No cases found for this client</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Case ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cases.map((caseItem, index) => (
                <TableRow key={caseItem.id} className={index % 2 === 0 ? "bg-gray-100" : "bg-white"}>
                  <TableCell>{caseItem.id}</TableCell>
                  <TableCell>{caseItem.title}</TableCell>
                  <TableCell>{getStatusBadge(caseItem.status)}</TableCell>
                  <TableCell>{formatDate(caseItem.createdAt)}</TableCell>
                  <TableCell>{formatDate(caseItem.updatedAt)}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => router.push(`/cases/${caseItem.id}`)}
                      title="View Case"
                    >
                      <Eye size={16} />
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
