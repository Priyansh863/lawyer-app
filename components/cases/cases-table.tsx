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
import CaseDetailsDialog from "./case-details-dialog"
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

import { MoreHorizontal } from "lucide-react"
import CaseCreationForm from "./case-creation-form"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface CasesTableProps {
  initialCases?: Case[]
  onCaseCreated?: () => void
}

export default function CasesTable({ initialCases, onCaseCreated }: CasesTableProps) {
  const [cases, setCases] = useState<Case[]>(initialCases || [])
  const profile = useSelector((state: RootState) => state.auth.user)
  const [activeTab, setActiveTab] = useState<"in_progress" | "completed">("in_progress")

  const [isLoading, setIsLoading] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [statusUpdateDialog, setStatusUpdateDialog] = useState<{
    open: boolean
    case: Case | null
  }>({ open: false, case: null })
  const [caseDetailsDialog, setCaseDetailsDialog] = useState<{
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
        // If we want to filter by tab as well, we can incorporate activeTab here
        let statusFilter = formData.status === "all" ? undefined : formData.status;

        const fetchedCases = await getCases({
          status: statusFilter,
          query: formData.query || undefined,
        })

        let filtered = fetchedCases.cases || [];
        // Apply tab filtering logic locally if not handled by API
        if (activeTab === "in_progress") {
          filtered = filtered.filter((c: Case) => c.status === "in_progress" || c.status === "pending");
        } else {
          filtered = filtered.filter((c: Case) => c.status !== "in_progress" && c.status !== "pending");
        }

        setCases(filtered)
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
  }, [searchForm.watch('query'), searchForm.watch('status'), activeTab, searchForm, refreshKey])

  const refresh = () => setRefreshKey(prev => prev + 1)

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
    setCaseDetailsDialog({ open: true, case: caseItem })
  }

  const getStatusDisplay = (status: string) => {
    const s = status.toLowerCase();

    // Map snake_case to camelCase for translation keys if needed
    const translationKey = status.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
    let label = t(`pages:cases.status.${translationKey}`);

    // Fallback if not found
    if (label === `pages:cases.status.${translationKey}`) {
      if (s === "pending") label = t('pages:cases.status.pending');
      else if (s === "in_progress") label = t('pages:cases.status.inProgress');
      else label = status.replace('_', ' ').charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
    }

    let colorClass = "bg-slate-400";
    if (s === "pending") colorClass = "bg-orange-500";
    else if (s === "in_progress") colorClass = "bg-emerald-500";
    else if (s === "full_win") colorClass = "bg-blue-600";
    else if (s === "full_loss") colorClass = "bg-red-600";

    return (
      <div className="flex items-center gap-2">
        <div className={cn("w-2 h-2 rounded-full", colorClass)} />
        <span className="text-sm font-medium text-slate-900">{label}</span>
      </div>
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
    refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-0">
        {/* Tabs */}
        <div className="flex items-center gap-8">
          <button
            onClick={() => setActiveTab("in_progress")}
            className={cn(
              "pb-4 text-sm font-bold transition-all relative px-1",
              activeTab === "in_progress" ? "text-slate-900" : "text-slate-700 hover:text-slate-900"
            )}
          >
            {t('pages:cases.status.inProgress')}
            {activeTab === "in_progress" && (
              <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-slate-900" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("completed")}
            className={cn(
              "pb-4 text-sm font-bold transition-all relative px-1",
              activeTab === "completed" ? "text-slate-900" : "text-slate-700 hover:text-slate-900"
            )}
          >
            {t('pages:cases.status.closure')}
            {activeTab === "completed" && (
              <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-slate-900" />
            )}
          </button>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <div className="relative w-full sm:w-64">
            <Input
              placeholder={t('pages:common.search')}
              {...searchForm.register("query")}
              className="bg-white border-slate-200 h-10 pl-4 pr-10 rounded-md text-sm font-bold text-slate-700 placeholder:text-slate-500 focus:ring-0 focus:border-slate-400"
            />
          </div>
          <select
            {...searchForm.register("status")}
            className="bg-white border border-slate-200 rounded-md h-10 px-3 text-sm font-bold text-slate-700 focus:outline-none focus:ring-0 focus:border-slate-400 min-w-[130px]"
          >
            <option value="all">{t('pages:common.allStatuses')}</option>
            <option value="pending">{t('pages:cases.status.pending')}</option>
            <option value="in_progress">{t('pages:cases.status.inProgress')}</option>
            <option value="full_win">{t('pages:cases.status.fullWin')}</option>
            <option value="full_loss">{t('pages:cases.status.fullLoss')}</option>
          </select>
          {profile?.account_type === 'lawyer' && (
            <CaseCreationForm
              onCaseCreated={onCaseCreated}
              trigger={
                <Button className="bg-[#0F172A] hover:bg-[#1E293B] text-white flex items-center gap-2 h-10 px-6 font-medium text-sm rounded-md transition-colors">
                  {t('pages:cases.newCase')}
                </Button>
              }
            />
          )}
        </div>
      </div>

      <div className="rounded-lg border border-slate-300 overflow-hidden bg-white shadow-sm">
        <Table className="w-full">
          <TableHeader className="bg-[#f8f9fa]">
            <TableRow className="hover:bg-transparent border-b border-slate-300">
              <TableHead className="text-[#0F172A] font-bold py-2 pl-4 text-[13px]">{t('pages:cases.table.caseNumber')}</TableHead>
              <TableHead className="text-[#0F172A] font-bold py-2 text-[13px]">{t('pages:cases.table.title')}</TableHead>
              <TableHead className="text-[#0F172A] font-bold py-2 text-[13px]">{t('pages:cases.table.client')}</TableHead>
              <TableHead className="text-[#0F172A] font-bold py-2 text-[13px]">{t('pages:cases.table.lawyer')}</TableHead>
              <TableHead className="text-[#0F172A] font-bold py-2 text-[13px]">{t('pages:cases.table.caseType')}</TableHead>
              <TableHead className="text-[#0F172A] font-bold py-2 text-[13px]">{t('pages:cases.table.courtType')}</TableHead>
              <TableHead className="text-[#0F172A] font-bold py-2 text-[13px]">{t('pages:cases.table.status')}</TableHead>
              <TableHead className="text-[#0F172A] font-bold py-2 text-center pr-4 text-[13px]">{t('pages:common.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index} className="border-b border-slate-300 last:border-0">
                  <TableCell className="pl-4 py-2"><Skeleton width={80} /></TableCell>
                  <TableCell className="py-2"><Skeleton width={120} /></TableCell>
                  <TableCell className="py-2"><Skeleton width={100} /></TableCell>
                  <TableCell className="py-2"><Skeleton width={100} /></TableCell>
                  <TableCell className="py-2"><Skeleton width={80} /></TableCell>
                  <TableCell className="py-2"><Skeleton width={80} /></TableCell>
                  <TableCell className="py-2"><Skeleton width={70} height={20} /></TableCell>
                  <TableCell className="pr-4 py-2 text-center"><Skeleton circle width={24} height={24} className="mx-auto" /></TableCell>
                </TableRow>
              ))
            ) : cases.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-20 text-slate-400 text-sm">
                  {t('pages:cases.noCasesFound')}
                </TableCell>
              </TableRow>
            ) : (
              cases.map((caseItem, index) => (
                <TableRow key={caseItem._id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-300 last:border-0 text-[#0F172A]">
                  <TableCell className="text-[13px] pl-4 py-2 font-medium">{caseItem.case_number}</TableCell>
                  <TableCell className="text-[13px] py-2 font-medium max-w-[150px]">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="block truncate cursor-help decoration-slate-300 transition-all font-semibold">
                            {caseItem.title}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs break-words">
                          <p>{caseItem.title}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell className="text-[13px] py-2 font-medium">
                    {caseItem.client_id && typeof caseItem.client_id === 'object' ?
                      `${caseItem.client_id.first_name} ${caseItem.client_id.last_name || ''}`.trim()
                      : 'N/A'
                    }
                  </TableCell>
                  <TableCell className="text-[13px] py-2 font-medium">
                    {caseItem.lawyer_id && typeof caseItem.lawyer_id === 'object' ?
                      `${caseItem.lawyer_id.first_name} ${caseItem.lawyer_id.last_name || ''}`.trim()
                      : 'N/A'
                    }
                  </TableCell>
                  <TableCell className="text-[13px] py-2 font-medium">
                    {t(`common:caseTypes.${caseItem.case_type}`)}
                  </TableCell>
                  <TableCell className="text-[13px] py-2 font-medium">
                    {t(`common:courtTypes.${caseItem.court_type}`)}
                  </TableCell>
                  <TableCell className="py-2">{getStatusDisplay(caseItem.status)}</TableCell>

                  <TableCell className="text-center pr-4 py-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-[#0F172A] hover:bg-slate-100 transition-colors">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40 border-slate-200">
                        <DropdownMenuItem onClick={() => viewCaseDetails(caseItem)} className="text-sm cursor-pointer">
                          {t('pages:common.viewDetails')}
                        </DropdownMenuItem>
                        {profile?.account_type === 'lawyer' && (
                          <DropdownMenuItem onClick={() => handleUpdateStatus(caseItem)} className="text-sm cursor-pointer">
                            {t('pages:cases.updateStatus')}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <CaseStatusUpdateDialog
        case={statusUpdateDialog.case}
        open={statusUpdateDialog.open}
        onOpenChange={(open) => setStatusUpdateDialog({ open, case: open ? statusUpdateDialog.case : null })}
        onStatusUpdated={handleStatusUpdated}
      />

      <CaseDetailsDialog
        caseData={caseDetailsDialog.case}
        open={caseDetailsDialog.open}
        onOpenChange={(open) => setCaseDetailsDialog({ open, case: open ? caseDetailsDialog.case : null })}
        onCaseUpdated={(updatedCase) => {
          setCases(prevCases =>
            prevCases.map(c =>
              (c._id || c.id) === (updatedCase._id || updatedCase.id) ? updatedCase : c
            )
          )
          setCaseDetailsDialog({ open: false, case: null })
          refresh()
        }}
        onCaseDeleted={(caseId) => {
          setCases(prevCases => prevCases.filter(c => (c._id || c.id) !== caseId))
          refresh()
        }}
      />
    </div>
  )
}