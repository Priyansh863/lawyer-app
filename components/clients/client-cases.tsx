"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Eye, Plus, MoreHorizontal, Loader2 } from "lucide-react"
import { getClientCases } from "@/lib/api/cases-api"
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
  const isClientViewer = profile?.account_type === "client"

  useEffect(() => {
    let isCancelled = false
    const loadCases = async () => {
      try {
        setIsLoading(true)
        const clientCases = await getClientCases(clientId, profile?.account_type === "lawyer" ? "client" : "lawyer")
        if (isCancelled) return
        setCases(clientCases || [])
      } catch (error) {
        console.error("Error fetching client cases:", error)
      } finally {
        if (!isCancelled) setIsLoading(false)
      }
    }

    if (clientId) {
      loadCases()
    }
    return () => {
      isCancelled = true
    }
  }, [clientId])

  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase()
    const map: Record<string, { bg: string; text: string; label: string }> = {
      pending: { bg: "bg-amber-50 border-amber-200", text: "text-amber-600", label: t('pages:clientDetails.status.pending') },
      open: { bg: "bg-amber-50 border-amber-200", text: "text-amber-600", label: t('pages:clientDetails.status.pending') },
      in_progress: { bg: "bg-blue-50 border-blue-200", text: "text-blue-600", label: t('pages:clientDetails.status.in_progress') },
      full_win: { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-600", label: t('pages:clientDetails.status.full_win') },
      settlement: { bg: "bg-sky-50 border-sky-200", text: "text-sky-600", label: t('pages:clientDetails.status.settlement') },
      rejected: { bg: "bg-red-50 border-red-200", text: "text-red-600", label: t('pages:clientDetails.status.rejected') },
      closure: { bg: "bg-slate-50 border-slate-200", text: "text-slate-600", label: t('pages:clientDetails.status.closure') },
    }
    const config = map[s] || { bg: "bg-slate-50 border-slate-200", text: "text-slate-600", label: status }
    return (
      <Badge variant="outline" className={`${config.bg} ${config.text} text-[10px] font-semibold px-2 py-0.5`}>
        {config.label}
      </Badge>
    )
  }

  const getClientName = (c: Case) => {
    if (c.client_id && typeof c.client_id === 'object') {
      return `${(c.client_id as any).first_name || ''} ${(c.client_id as any).last_name || ''}`.trim() || 'Client Name'
    }
    return (c as any).clientName || 'Client Name'
  }

  const getLawyerName = (c: Case) => {
    if (c.lawyer_id && typeof c.lawyer_id === 'object') {
      return `${(c.lawyer_id as any).first_name || ''} ${(c.lawyer_id as any).last_name || ''}`.trim() || 'N/A'
    }
    return (c as any).assignedTo?.[0] || 'N/A'
  }

  const getCaseTypeName = (ct: string) => {
    return t(`common:caseTypes.${ct}`) || ct || 'N/A'
  }

  const getCourtTypeName = (ct: string) => {
    return t(`common:courtTypes.${ct}`) || ct || 'N/A'
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[16px] font-bold text-[#0F172A]">
          {isClientViewer ? t('pages:clientDetails.lawyerCases') : t('pages:clientDetails.clientCases')}
        </h3>
        {profile?.account_type === 'lawyer' && (
          <Button
            onClick={() => router.push(`/cases/new?clientId=${clientId}`)}
            className="bg-[#0F172A] hover:bg-[#1E293B] text-white px-6 h-[38px] rounded-[4px] flex items-center gap-2 text-[13px] font-semibold"
          >
            {t('pages:clientDetails.addCase')}
          </Button>
        )}
      </div>

      <div className="rounded-lg border border-slate-200 overflow-hidden bg-white">
        <Table>
          <TableHeader className="bg-[#f8f9fa]">
            <TableRow className="border-b border-slate-200 hover:bg-transparent">
              <TableHead className="text-[11px] font-bold text-[#0F172A] py-2.5 px-3">{t('pages:clientDetails.caseNumber')}</TableHead>
              <TableHead className="text-[11px] font-bold text-[#0F172A] py-2.5 px-3">{t('pages:clientDetails.caseName')}</TableHead>
              <TableHead className="text-[11px] font-bold text-[#0F172A] py-2.5 px-3">{t('pages:clientDetails.client')}</TableHead>
              <TableHead className="text-[11px] font-bold text-[#0F172A] py-2.5 px-3">{t('pages:clientDetails.assignedLawyer')}</TableHead>
              <TableHead className="text-[11px] font-bold text-[#0F172A] py-2.5 px-3">{t('pages:clientDetails.caseType')}</TableHead>
              <TableHead className="text-[11px] font-bold text-[#0F172A] py-2.5 px-3">{t('pages:clientDetails.court')}</TableHead>
              <TableHead className="text-[11px] font-bold text-[#0F172A] py-2.5 px-3">{t('pages:clientDetails.statusText')}</TableHead>
              <TableHead className="text-[11px] font-bold text-[#0F172A] py-2.5 px-3 text-center">{t('pages:clientDetails.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10">
                  <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('pages:clientDetails.loadingCases')}
                  </div>
                </TableCell>
              </TableRow>
            ) : cases.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-xs text-slate-400">
                  {t('pages:clientDetails.noCasesFound')}
                </TableCell>
              </TableRow>
            ) : (
              cases.map((c, idx) => (
                <TableRow key={c.id || c._id || idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                  <TableCell className="text-[11px] font-medium text-[#0F172A] py-2.5 px-3">{c.case_number || 'N/A'}</TableCell>
                  <TableCell className="text-[11px] font-medium text-[#0F172A] py-2.5 px-3 max-w-[140px] truncate">{c.title || 'Case Name'}</TableCell>
                  <TableCell className="text-[11px] font-medium text-[#0F172A] py-2.5 px-3">{getClientName(c)}</TableCell>
                  <TableCell className="text-[11px] font-medium text-[#0F172A] py-2.5 px-3">{getLawyerName(c)}</TableCell>
                  <TableCell className="text-[11px] font-medium text-[#0F172A] py-2.5 px-3">{getCaseTypeName(c.case_type)}</TableCell>
                  <TableCell className="text-[11px] font-medium text-[#0F172A] py-2.5 px-3 max-w-[180px] truncate">{getCourtTypeName(c.court_type)}</TableCell>
                  <TableCell className="py-2.5 px-3">{getStatusBadge(c.status)}</TableCell>
                  <TableCell className="text-center py-2.5 px-3">
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <MoreHorizontal className="h-4 w-4 text-slate-400" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40 bg-white border border-slate-200 shadow-lg z-[200]">
                        <DropdownMenuItem
                          className="text-[12px] cursor-pointer"
                          onClick={() => {
                            const caseData = encodeURIComponent(JSON.stringify(c))
                            router.push(`/cases/${c._id || c.id}?data=${caseData}`)
                          }}
                        >
                          <Eye className="h-3.5 w-3.5 mr-2" />
                          {t('pages:clientDetails.viewDetails')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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