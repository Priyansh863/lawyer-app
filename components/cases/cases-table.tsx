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
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { getCases } from "@/lib/api/cases-api"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/hooks/useTranslation"
import { Eye, Edit3 } from "lucide-react"
import { useSelector } from "react-redux"
import { RootState } from "@/lib/store"
import CaseStatusUpdateDialog from "./case-status-update-dialog"
import { caseTypeConfig, courtTypeConfig } from "@/types/case"

const searchFormSchema = z.object({
  query: z.string().optional(),
  status: z.enum([
    "all",
    // Judgment Outcomes (판결 종국)
    "full_win", "full_loss", "partial_win", "partial_loss", "dismissal", "rejection",
    // Non-Judgment Outcomes (판결 외 종국)
    "withdrawal", "mediation", "settlement", "trial_cancellation", "suspension", "closure",
    // Active case statuses
    "in_progress", "pending"
  ]).default("all"),
})
type SearchFormData = z.infer<typeof searchFormSchema>

const statusUpdateSchema = z.object({
  caseId: z.string(),
  status: z.enum([
    // Judgment Outcomes (판결 종국)
    "full_win", "full_loss", "partial_win", "partial_loss", "dismissal", "rejection",
    // Non-Judgment Outcomes (판결 외 종국)
    "withdrawal", "mediation", "settlement", "trial_cancellation", "suspension", "closure",
    // Active case statuses
    "in_progress", "pending"
  ]),
})
type StatusUpdateData = z.infer<typeof statusUpdateSchema>

interface CasesTableProps {
  initialCases?: Case[]
}

export default function CasesTable({ initialCases }: CasesTableProps) {
  const [cases, setCases] = useState<Case[]>(initialCases || [])
  const profile = useSelector((state: RootState) => state.auth.user)

  const [isLoading, setIsLoading] = useState(false)
  const [statusUpdateDialog, setStatusUpdateDialog] = useState<{
    open: boolean
    case: Case | null
  }>({ open: false, case: null })
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { t } = useTranslation()

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
        setCases(fetchedCases.cases || [])
      } catch (error) {
        toast({
          title: t("common.error"),
          description: t("common.error"),
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
    fetchCases()
  }, [searchForm.watch('query'), searchForm.watch('status'), toast, searchForm])

  // Remove the frontend filtering since we're now doing API-based filtering
  // useEffect(() => {
  //   const query = searchForm.watch('query') || ''
  //   const status = searchForm.watch('status')
    
  //   let filtered = cases
    
  //   // Filter by search query
  //   if (query.trim()) {
  //     filtered = filtered.filter(caseItem => 
  //       caseItem.title?.toLowerCase().includes(query.toLowerCase()) ||
  //       caseItem.case_number?.toLowerCase().includes(query.toLowerCase()) ||
  //       (typeof caseItem.client_id === 'object' && caseItem.client_id !== null
  //         ? `${caseItem.client_id.first_name || ''} ${caseItem.client_id.last_name || ''}`.toLowerCase().includes(query.toLowerCase())
  //         : false) ||
  //       (typeof caseItem.lawyer_id === 'object' && caseItem.lawyer_id !== null
  //         ? `${caseItem.lawyer_id.first_name || ''} ${caseItem.lawyer_id.last_name || ''}`.toLowerCase().includes(query.toLowerCase())
  //         : false)
  //     )
  //   }
    
  //   // Filter by status
  //   if (status && status !== 'all') {
  //     filtered = filtered.filter(caseItem => caseItem.status === status)
  //   }
    
  //   setFilteredCases(filtered)
  // }, [searchForm.watch('query'), searchForm.watch('status'), cases])

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

  // View case details
  const viewCaseDetails = (caseItem: Case) => {
    // Encode case data as URL search params to pass to details page
    const caseData = encodeURIComponent(JSON.stringify(caseItem))
    router.push(`/cases/${caseItem._id}?data=${caseData}`)
  }

  // Get status badge
  const STATUS_CONFIG = {
    // Judgment Outcomes (판결 종국)
    full_win: { label: "Full Win (전부 승소)", color: "bg-green-100 text-green-800" },
    full_loss: { label: "Full Loss (전부 패소)", color: "bg-red-100 text-red-800" },
    partial_win: { label: "Partial Win (부분 승소)", color: "bg-emerald-100 text-emerald-800" },
    partial_loss: { label: "Partial Loss (부분 패소)", color: "bg-orange-100 text-orange-800" },
    dismissal: { label: "Dismissal (기각)", color: "bg-red-200 text-red-900" },
    rejection: { label: "Rejection (각하)", color: "bg-red-300 text-red-900" },
    // Non-Judgment Outcomes (판결 외 종국)
    withdrawal: { label: "Withdrawal (취하)", color: "bg-gray-100 text-gray-800" },
    mediation: { label: "Mediation (조정)", color: "bg-blue-100 text-blue-800" },
    settlement: { label: "Settlement (화해)", color: "bg-teal-100 text-teal-800" },
    trial_cancellation: { label: "Trial Cancellation (공판취소)", color: "bg-purple-100 text-purple-800" },
    suspension: { label: "Suspension (중지)", color: "bg-yellow-100 text-yellow-800" },
    closure: { label: "Closure (종결)", color: "bg-slate-100 text-slate-800" },
    // Active case statuses
    in_progress: { label: "In Progress (진행 중)", color: "bg-blue-50 text-blue-700" },
    pending: { label: "Pending (대기 중)", color: "bg-amber-50 text-amber-700" }
  } as const

  const getStatusBadge = (status: string) => {
    // Normalize the status and fallback to "pending" if invalid
    const validStatuses = ["full_win", "full_loss", "partial_win", "partial_loss", "dismissal", "rejection", "withdrawal", "mediation", "settlement", "trial_cancellation", "suspension", "closure", "in_progress", "pending"]
    const normalizedStatus = (
      validStatuses.includes(status.toLowerCase()) ? status.toLowerCase() : "pending"
    ) as keyof typeof STATUS_CONFIG
    return (
      <Badge variant="outline" className={STATUS_CONFIG[normalizedStatus].color}>
        {STATUS_CONFIG[normalizedStatus].label}
      </Badge>
    )
  }

  // Handle opening status update dialog
  const handleUpdateStatus = (caseItem: Case) => {
    setStatusUpdateDialog({ open: true, case: caseItem })
  }

  // Handle status update completion
  const handleStatusUpdated = (caseId: string, newStatus: CaseStatus) => {
    setCases(prevCases =>
      prevCases.map(c =>
        (c._id || c.id) === caseId
          ? { ...c, status: newStatus }
          : c
      )
    )
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
                        placeholder={t("common.search")}
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
                <FormControl>
                  <select
                    {...field}
                    className="bg-[#F5F5F5] border-gray-200 rounded px-3 py-2"
                  >
                    <option value="all">{t("common.filter")}</option>
                    
                    {/* Active Case Statuses */}
                    <optgroup label="Active Cases">
                      <option value="open">대기 중 (Pending)</option>
                      <option value="in_progress">진행 중 (In Progress)</option>
                    </optgroup>
                    
                    {/* Judgment Outcomes (판결 종국) */}
                    <optgroup label="Judgment Outcomes (판결 종국)">
                      <option value="full_win">전부 승소 (Full Win)</option>
                      <option value="full_loss">전부 패소 (Full Loss)</option>
                      <option value="partial_win">부분 승소 (Partial Win)</option>
                      <option value="partial_loss">부분 패소 (Partial Loss)</option>
                      <option value="dismissal">기각 (Dismissal)</option>
                      <option value="rejection">각하 (Rejection)</option>
                    </optgroup>
                    
                    {/* Non-Judgment Outcomes (판결 외 종국) */}
                    <optgroup label="Non-Judgment Outcomes (판결 외 종국)">
                      <option value="withdrawal">취하 (Withdrawal)</option>
                      <option value="mediation">조정 (Mediation)</option>
                      <option value="settlement">화해 (Settlement)</option>
                      <option value="trial_cancellation">공판취소 (Trial Cancellation)</option>
                      <option value="suspension">중지 (Suspension)</option>
                      <option value="closure">종결 (Closure)</option>
                    </optgroup>
                  </select>
                </FormControl>
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
              <TableHead>Case Number</TableHead>
              <TableHead>{t("pages:cases.caseTitle")}</TableHead>
              <TableHead>{t("pages:cases.clientName")}</TableHead>
              <TableHead>{t("pages:cases.assignedLawyer")}</TableHead>
              <TableHead>Case Type</TableHead>
              <TableHead>Court Type</TableHead>
              <TableHead>{t("pages:cases.status")}</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cases.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  {isLoading ? t("common.loading") : t("pages:cases.title")}
                </TableCell>
              </TableRow>
            ) : (
              cases.map((caseItem, index) => (
                <TableRow key={caseItem._id} className={index % 2 === 0 ? "bg-gray-100" : "bg-white"}>
                  <TableCell className="font-mono">{caseItem.case_number}</TableCell>
                  <TableCell>{caseItem.title}</TableCell>
                  <TableCell>
                    {caseItem.client_id && typeof caseItem.client_id === 'object' ? 
                      `${caseItem.client_id.first_name} ${caseItem.client_id.last_name || ''}`.trim() 
                      : 'N/A'
                    }
                  </TableCell>
                  <TableCell>
                    {caseItem.lawyer_id && typeof caseItem.lawyer_id === 'object' ? 
                      `${caseItem.lawyer_id.first_name} ${caseItem.lawyer_id.last_name || ''}`.trim() 
                      : 'N/A'
                    }
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={caseTypeConfig[caseItem.case_type as keyof typeof caseTypeConfig]?.color || "bg-gray-100 text-gray-800"}>
                      {caseTypeConfig[caseItem.case_type as keyof typeof caseTypeConfig]?.label || caseItem.case_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={courtTypeConfig[caseItem.court_type as keyof typeof courtTypeConfig]?.color || "bg-gray-100 text-gray-800"}>
                      {courtTypeConfig[caseItem.court_type as keyof typeof courtTypeConfig]?.label || caseItem.court_type}
                    </Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(caseItem.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => viewCaseDetails(caseItem)} className="h-8 w-8">
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">View Details</span>
                      </Button>
                      {profile?.account_type === 'lawyer' && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleUpdateStatus(caseItem)} 
                          className="h-8 w-8"
                        >
                          <Edit3 className="h-4 w-4" />
                          <span className="sr-only">Update Status</span>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Status Update Dialog */}
      <CaseStatusUpdateDialog
        case={statusUpdateDialog.case}
        open={statusUpdateDialog.open}
        onOpenChange={(open) => setStatusUpdateDialog({ open, case: open ? statusUpdateDialog.case : null })}
        onStatusUpdated={handleStatusUpdated}
      />
    </div>
  )
}
