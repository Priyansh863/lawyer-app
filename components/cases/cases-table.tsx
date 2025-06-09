"use client"
import type { Case, CaseStatus } from "@/types/case"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useSearchParams, useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { Eye, FileText, Loader2 } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { getCases, updateCaseStatus } from "@/lib/api/cases-api"
import { useToast } from "@/hooks/use-toast"

const searchFormSchema = z.object({
  query: z.string().optional(),
  status: z.enum(["all", "pending", "approved", "rejected"]).default("all"),
})

type SearchFormData = z.infer<typeof searchFormSchema>

const statusUpdateSchema = z.object({
  caseId: z.string(),
  status: z.enum(["pending", "approved", "rejected"]),
})

type StatusUpdateData = z.infer<typeof statusUpdateSchema>

interface CasesTableProps {
  initialCases?: Case[]
}

export default function CasesTable({ initialCases }: CasesTableProps) {
  const [cases, setCases] = useState<Case[]>(initialCases || [])
  const [isLoading, setIsLoading] = useState(false)
  const [updatingCases, setUpdatingCases] = useState<Set<string>>(new Set())

  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  // Search and filter form
  const searchForm = useForm<SearchFormData>({
    resolver: zodResolver(searchFormSchema),
    defaultValues: {
      query: searchParams?.get("query") || "",
      status: (searchParams?.get("status") as CaseStatus) || "all",
    },
  })

  // Load cases with filters
  useEffect(() => {
    const fetchCases = async () => {
      setIsLoading(true)
      try {
        const formData = searchForm.getValues()
        const fetchedCases = await getCases({
          status: formData.status === "all" ? undefined : formData.status,
          query: formData.query || undefined,
        })
        setCases(fetchedCases)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load cases",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchCases()
  }, [searchParams, toast, searchForm])

  // Handle search form submission
  const onSearchSubmit = async (data: SearchFormData) => {
    const params = new URLSearchParams()

    if (data.query) {
      params.set("query", data.query)
    }

    if (data.status !== "all") {
      params.set("status", data.status)
    }

    router.push(`/cases?${params.toString()}`)
  }

  // Handle case status update
  const handleStatusUpdate = async (caseId: string, newStatus: CaseStatus) => {
    setUpdatingCases((prev) => new Set(prev).add(caseId))

    try {
      const updateData: StatusUpdateData = { caseId, status: newStatus }
      await updateCaseStatus(updateData.caseId, updateData.status)

      // Update local state
      setCases(cases.map((c) => (c.id === caseId ? { ...c, status: newStatus } : c)))

      toast({
        title: "Status updated",
        description: `Case ${caseId} has been ${newStatus}`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update case status",
        variant: "destructive",
      })
    } finally {
      setUpdatingCases((prev) => {
        const newSet = new Set(prev)
        newSet.delete(caseId)
        return newSet
      })
    }
  }

  // View case details
  const viewCaseDetails = (caseId: string) => {
    router.push(`/cases/${caseId}`)
  }

  // Get status badge
  const getStatusBadge = (status: CaseStatus) => {
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
    <div className="space-y-4">
      <Form {...searchForm}>
        <form
          onSubmit={searchForm.handleSubmit(onSearchSubmit)}
          className="flex flex-col sm:flex-row gap-4 justify-between"
        >
          <div className="flex w-full max-w-sm items-center space-x-2">
            <FormField
              control={searchForm.control}
              name="query"
              render={({ field }) => (
                <FormItem className="flex-1 relative">
                  <FormControl>
                    <div className="relative">
                      <Input
                        placeholder="Search cases..."
                        {...field}
                        value={field.value || ""}
                        className="bg-[#F5F5F5] border-gray-200 pl-10"
                      />
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"
                      >
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.3-4.3" />
                      </svg>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={searchForm.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Case ID</TableHead>
              <TableHead>Client Name</TableHead>
              <TableHead>Case Title</TableHead>
              <TableHead>Recent Update</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cases.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {isLoading ? "Loading cases..." : "No cases found"}
                </TableCell>
              </TableRow>
            ) : (
              cases.map((caseItem, index) => (
                <TableRow key={caseItem.id} className={index % 2 === 0 ? "bg-gray-100" : "bg-white"}>
                  <TableCell className="font-mono">{caseItem.id}</TableCell>
                  <TableCell>{caseItem.clientName || "N/A"}</TableCell>
                  <TableCell>{caseItem.title}</TableCell>
                  <TableCell>{formatDate(caseItem.updatedAt)}</TableCell>
                  <TableCell>{getStatusBadge(caseItem.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => viewCaseDetails(caseItem.id)}
                        title="View Case"
                      >
                        <Eye size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(`/cases/${caseItem.id}/files`)}
                        title="View Files"
                      >
                        <FileText size={16} />
                      </Button>
                      {caseItem.status === "pending" && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleStatusUpdate(caseItem.id, "approved")}
                            className="text-green-600"
                            title="Approve Case"
                            disabled={updatingCases.has(caseItem.id)}
                          >
                            {updatingCases.has(caseItem.id) ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M20 6 9 17l-5-5" />
                              </svg>
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleStatusUpdate(caseItem.id, "rejected")}
                            className="text-red-600"
                            title="Reject Case"
                            disabled={updatingCases.has(caseItem.id)}
                          >
                            {updatingCases.has(caseItem.id) ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M18 6 6 18" />
                                <path d="m6 6 12 12" />
                              </svg>
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
