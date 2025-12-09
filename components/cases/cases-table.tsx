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
import Skeleton from "react-loading-skeleton"
import "react-loading-skeleton/dist/skeleton.css"

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
          title: t("pages:common.error"),
          description: t("pages:cases.error.fetchingCases"),
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
    fetchCases()
  }, [searchForm.watch('query'), searchForm.watch('status'),searchForm])

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
    full_win: { 
      label: t("pages:cases.status.fullWin"), 
      color: "bg-green-100 text-green-800" 
    },
    full_loss: { 
      label: t("pages:cases.status.fullLoss"), 
      color: "bg-red-100 text-red-800" 
    },
    partial_win: { 
      label: t("pages:cases.status.partialWin"), 
      color: "bg-emerald-100 text-emerald-800" 
    },
    partial_loss: { 
      label: t("pages:cases.status.partialLoss"), 
      color: "bg-orange-100 text-orange-800" 
    },
    dismissal: { 
      label: t("pages:cases.status.dismissal"), 
      color: "bg-red-200 text-red-900" 
    },
    rejection: { 
      label: t("pages:cases.status.rejection"), 
      color: "bg-red-300 text-red-900" 
    },
    // Non-Judgment Outcomes (판결 외 종국)
    withdrawal: { 
      label: t("pages:cases.status.withdrawal"), 
      color: "bg-gray-100 text-gray-800" 
    },
    mediation: { 
      label: t("pages:cases.status.mediation"), 
      color: "bg-blue-100 text-blue-800" 
    },
    settlement: { 
      label: t("pages:cases.status.settlement"), 
      color: "bg-teal-100 text-teal-800" 
    },
    trial_cancellation: { 
      label: t("pages:cases.status.trialCancellation"), 
      color: "bg-purple-100 text-purple-800" 
    },
    suspension: { 
      label: t("pages:cases.status.suspension"), 
      color: "bg-yellow-100 text-yellow-800" 
    },
    closure: { 
      label: t("pages:cases.status.closure"), 
      color: "bg-slate-100 text-slate-800" 
    },
    // Active case statuses
    in_progress: { 
      label: t("pages:cases.status.inProgress"), 
      color: "bg-blue-50 text-blue-700" 
    },
    pending: { 
      label: t("pages:cases.status.pending"), 
      color: "bg-amber-50 text-amber-700" 
    }
  } as const

  const getStatusBadge = (status: string) => {
    const validStatuses = Object.keys(STATUS_CONFIG)
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
                        placeholder={t("pages:common.searchPlaceholder")}
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
                    <option value="all">{t("common.allStatuses")}</option>

                    {/* Active Case Statuses */}
                    <optgroup label={t("pages:cases.statusGroup.active")}>
                      <option value="pending">{t("pages:cases.status.pending")}</option>
                      <option value="in_progress">{t("pages:cases.status.inProgress")}</option>
                    </optgroup>

                    {/* Judgment Outcomes */}
                    <optgroup label={t("pages:cases.statusGroup.judgment")}>
                      <option value="full_win">{t("pages:cases.status.fullWin")}</option>
                      <option value="full_loss">{t("pages:cases.status.fullLoss")}</option>
                      <option value="partial_win">{t("pages:cases.status.partialWin")}</option>
                      <option value="partial_loss">{t("pages:cases.status.partialLoss")}</option>
                      <option value="dismissal">{t("pages:cases.status.dismissal")}</option>
                      <option value="rejection">{t("pages:cases.status.rejection")}</option>
                    </optgroup>

                    {/* Non-Judgment Outcomes */}
                    <optgroup label={t("pages:cases.statusGroup.nonJudgment")}>
                      <option value="withdrawal">{t("pages:cases.status.withdrawal")}</option>
                      <option value="mediation">{t("pages:cases.status.mediation")}</option>
                      <option value="settlement">{t("pages:cases.status.settlement")}</option>
                      <option value="trial_cancellation">{t("pages:cases.status.trialCancellation")}</option>
                      <option value="suspension">{t("pages:cases.status.suspension")}</option>
                      <option value="closure">{t("pages:cases.status.closure")}</option>
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
              <TableHead>{t("pages:cases.table.caseNumber")}</TableHead>
              <TableHead>{t("pages:cases.table.title")}</TableHead>
              <TableHead>{t("pages:cases.table.client")}</TableHead>
              <TableHead>{t("pages:cases.table.lawyer")}</TableHead>
              <TableHead className="min-w-[140px]">{t("pages:cases.table.caseType")}</TableHead>

              <TableHead className="pl-7">{t("pages:cases.table.courtType")}</TableHead>
              <TableHead className="pl-6">{t("pages:cases.table.status")}</TableHead>
              <TableHead className="pl-8">{t("pages:common.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Show skeleton loading state
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index} className={index % 2 === 0 ? "bg-gray-100" : "bg-white"}>
                  <TableCell><Skeleton width={80} /></TableCell>
                  <TableCell><Skeleton width={120} /></TableCell>
                  <TableCell><Skeleton width={100} /></TableCell>
                  <TableCell><Skeleton width={100} /></TableCell>
                  <TableCell><Skeleton width={80} /></TableCell>
                  <TableCell><Skeleton width={80} /></TableCell>
                  <TableCell><Skeleton width={70} height={24} /></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Skeleton circle width={32} height={32} />
                      {profile?.account_type === 'lawyer' && (
                        <Skeleton circle width={32} height={32} />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : cases.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  {t("pages:cases.noCasesFound")}
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
                      {t(`pages:cases.caseTypes.${caseItem.case_type}`, { defaultValue: caseItem.case_type })}
                    </Badge>
                  </TableCell >
                  <TableCell >
                    <Badge variant="outline" className={courtTypeConfig[caseItem.court_type as keyof typeof courtTypeConfig]?.color || "bg-gray-100 text-gray-800"}>
                      {t(`pages:cases.courts.${caseItem.court_type}`, { defaultValue: caseItem.court_type })}
                    </Badge>
                  </TableCell>
                  <TableCell className="min-w-[130px]">{getStatusBadge(caseItem.status)}</TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => viewCaseDetails(caseItem)} 
                        className="h-8 w-8"
                        aria-label={t("pages:common.viewDetails")}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {profile?.account_type === 'lawyer' && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleUpdateStatus(caseItem)} 
                          className="h-8 w-8"
                          aria-label={t("pages:cases.updateStatus")}
                        >
                          <Edit3 className="h-4 w-4" />
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