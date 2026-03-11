"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import type { Case, CaseStatus } from "@/types/case"
import { useTranslation } from "@/hooks/useTranslation"

const statusUpdateSchema = z.object({
  status: z.enum([
    "full_win", "full_loss", "partial_win", "partial_loss", "dismissal", "rejection",
    "withdrawal", "mediation", "settlement", "trial_cancellation", "suspension", "closure",
    "in_progress", "pending"
  ]),
})

type StatusUpdateData = z.infer<typeof statusUpdateSchema>

const getToken = () => {
  if (typeof window !== "undefined") {
    const user = localStorage.getItem("user")
    return user ? JSON.parse(user).token : null
  }
  return null
}

interface CaseStatusUpdateDialogProps {
  case: Case | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onStatusUpdated: (caseId: string, newStatus: CaseStatus) => void
}

export default function CaseStatusUpdateDialog({
  case: selectedCase,
  open,
  onOpenChange,
  onStatusUpdated
}: CaseStatusUpdateDialogProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const { toast } = useToast()
  const { t } = useTranslation()

  const form = useForm<StatusUpdateData>({
    resolver: zodResolver(statusUpdateSchema),
    defaultValues: {
      status: selectedCase?.status || "pending"
    }
  })

  useState(() => {
    if (selectedCase) {
      form.reset({ status: selectedCase.status })
    }
  })

  const onSubmit = async (data: StatusUpdateData) => {
    if (!selectedCase) return

    try {
      setIsUpdating(true)

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL
      const token = getToken()

      const response = await fetch(`${API_BASE_URL}/case/${selectedCase._id || selectedCase.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: data.status
        })
      })

      if (!response.ok) {
        throw new Error(t("pages:cases.error.updateFailed"))
      }

      const result = await response.json()

      if (result.success) {
        toast({
          title: t("cases.statusUpdated.title"),
          description: t("pages:cases.statusUpdated.description", {
            status: t(`pages:cases.status.${data.status}`)
          }),
        })

        onStatusUpdated(selectedCase._id || selectedCase.id, data.status)
        onOpenChange(false)
      } else {
        throw new Error(result.message || t("pages:cases.error.updateFailed"))
      }
    } catch (error: any) {
      console.error('Error updating case status:', error)
      toast({
        title: t("common.error"),
        description: error.message || t("pages:cases.error.tryAgain"),
        variant: "destructive"
      })
    } finally {
      setIsUpdating(false)
    }
  }

  // Status options with translations
  const STATUS_OPTIONS = [
    // Active case statuses
    { value: "pending", label: t("pages:cases.status.pending"), category: t("pages:cases.statusGroup.active") },
    { value: "in_progress", label: t("pages:cases.status.inProgress"), category: t("pages:cases.statusGroup.active") },
    
    // Judgment Outcomes
    { value: "full_win", label: t("pages:cases.status.fullWin"), category: t("pages:cases.statusGroup.judgment") },
    { value: "full_loss", label: t("pages:cases.status.fullLoss"), category: t("pages:cases.statusGroup.judgment") },
    { value: "partial_win", label: t("pages:cases.status.partialWin"), category: t("pages:cases.statusGroup.judgment") },
    { value: "partial_loss", label: t("pages:cases.status.partialLoss"), category: t("pages:cases.statusGroup.judgment") },
    { value: "dismissal", label: t("pages:cases.status.dismissal"), category: t("pages:cases.statusGroup.judgment") },
    { value: "rejection", label: t("pages:cases.status.rejection"), category: t("pages:cases.statusGroup.judgment") },
    
    // Non-Judgment Outcomes
    { value: "withdrawal", label: t("pages:cases.status.withdrawal"), category: t("pages:cases.statusGroup.nonJudgment") },
    { value: "mediation", label: t("pages:cases.status.mediation"), category: t("pages:cases.statusGroup.nonJudgment") },
    { value: "settlement", label: t("pages:cases.status.settlement"), category: t("pages:cases.statusGroup.nonJudgment") },
    { value: "trial_cancellation", label: t("pages:cases.status.trialCancellation"), category: t("pages:cases.statusGroup.nonJudgment") },
    { value: "suspension", label: t("pages:cases.status.suspension"), category: t("pages:cases.statusGroup.nonJudgment") },
    { value: "closure", label: t("pages:cases.status.closure"), category: t("pages:cases.statusGroup.nonJudgment") },
  ]

  // Group status options by category
  const groupedOptions = STATUS_OPTIONS.reduce((acc, option) => {
    if (!acc[option.category]) {
      acc[option.category] = []
    }
    acc[option.category].push(option)
    return acc
  }, {} as Record<string, typeof STATUS_OPTIONS>)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("pages:cases.updateStatusPopup.title")}</DialogTitle>
          <DialogDescription>
            {t("pages:cases.updateStatusPopup.description", { caseTitle: selectedCase?.title })}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("pages:cases.statusLabel")}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("pages:cases.selectStatusPlaceholder")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-[300px]">
                      {Object.entries(groupedOptions).map(([category, options]) => (
                        <div key={category}>
                          <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                            {category}
                          </div>
                          {options.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isUpdating}
              >
                {t("pages:commonf.cancel")}
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("pages:cases.updateStatusButton")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}