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
import { Eye } from "lucide-react"
import { useSelector } from "react-redux"
import { RootState } from "@/lib/store"

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
  const profile = useSelector((state: RootState) => state.auth.user)

  const [isLoading, setIsLoading] = useState(false)
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
    pending: {
      label: "Pending",
      className: "bg-yellow-50 text-yellow-600 border-yellow-200",
    },
    approved: {
      label: "Approved",
      className: "bg-green-50 text-green-600 border-green-200",
    },
    rejected: {
      label: "Rejected",
      className: "bg-red-50 text-red-600 border-red-200",
    },
  } as const

  const getStatusBadge = (status: string) => {
    // Normalize the status and fallback to "pending" if invalid
    const normalizedStatus = (
      ["pending", "approved", "rejected"].includes(status.toLowerCase()) ? status.toLowerCase() : "pending"
    ) as CaseStatus
    return (
      <Badge variant="outline" className={STATUS_CONFIG[normalizedStatus].className}>
        {STATUS_CONFIG[normalizedStatus].label}
      </Badge>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4 mt-6">
        <h2 className="text-xl font-semibold">{t("pages:cases.title")}</h2>
        {profile?.account_type === 'lawyer' && (
    <Button onClick={() => router.push("/cases/new")} className="bg-[#0f0921] hover:bg-[#0f0921]/90">
      {t("pages:cases.newCase")}
    </Button>
  )}
      </div>
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
                    <option value="pending">{t("pages:cases.pending")}</option>
                    <option value="approved">{t("pages:cases.active")}</option>
                    <option value="rejected">{t("pages:cases.closed")}</option>
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
              <TableHead>{t("pages:cases.caseTitle")}</TableHead>
              <TableHead>{t("pages:cases.caseDescription")}</TableHead>
              <TableHead>{t("pages:cases.clientName")}</TableHead>
              <TableHead>{t("pages:cases.assignedLawyer")}</TableHead>
              <TableHead>{t("pages:cases.status")}</TableHead>
              <TableHead>{t("common.view")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cases.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
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
                  <TableCell>{getStatusBadge(caseItem.status)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => viewCaseDetails(caseItem)} className="h-8 w-8">
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">{t("common.view")}</span>
                    </Button>
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
