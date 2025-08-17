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

const statusUpdateSchema = z.object({
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

// Status options with Korean translations
const STATUS_OPTIONS = [
  // Active case statuses
  { value: "pending", label: "Pending (대기 중)", category: "Active" },
  { value: "in_progress", label: "In Progress (진행 중)", category: "Active" },
  
  // Judgment Outcomes (판결 종국)
  { value: "full_win", label: "Full Win (전부 승소)", category: "Judgment Outcome" },
  { value: "full_loss", label: "Full Loss (전부 패소)", category: "Judgment Outcome" },
  { value: "partial_win", label: "Partial Win (부분 승소)", category: "Judgment Outcome" },
  { value: "partial_loss", label: "Partial Loss (부분 패소)", category: "Judgment Outcome" },
  { value: "dismissal", label: "Dismissal (기각)", category: "Judgment Outcome" },
  { value: "rejection", label: "Rejection (각하)", category: "Judgment Outcome" },
  
  // Non-Judgment Outcomes (판결 외 종국)
  { value: "withdrawal", label: "Withdrawal (취하)", category: "Non-Judgment Outcome" },
  { value: "mediation", label: "Mediation (조정)", category: "Non-Judgment Outcome" },
  { value: "settlement", label: "Settlement (화해)", category: "Non-Judgment Outcome" },
  { value: "trial_cancellation", label: "Trial Cancellation (공판취소)", category: "Non-Judgment Outcome" },
  { value: "suspension", label: "Suspension (중지)", category: "Non-Judgment Outcome" },
  { value: "closure", label: "Closure (종결)", category: "Non-Judgment Outcome" },
]

export default function CaseStatusUpdateDialog({
  case: selectedCase,
  open,
  onOpenChange,
  onStatusUpdated
}: CaseStatusUpdateDialogProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const { toast } = useToast()

  const form = useForm<StatusUpdateData>({
    resolver: zodResolver(statusUpdateSchema),
    defaultValues: {
      status: selectedCase?.status || "pending"
    }
  })

  // Reset form when case changes
  useState(() => {
    if (selectedCase) {
      form.reset({ status: selectedCase.status })
    }
  })

  const onSubmit = async (data: StatusUpdateData) => {
    if (!selectedCase) return

    try {
      setIsUpdating(true)

      // API call to update case status
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
        throw new Error(`Failed to update case status: ${response.statusText}`)
      }

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Status Updated",
          description: `Case status has been updated to ${STATUS_OPTIONS.find(opt => opt.value === data.status)?.label}`,
        })

        // Notify parent component
        onStatusUpdated(selectedCase._id || selectedCase.id, data.status)
        onOpenChange(false)
      } else {
        throw new Error(result.message || 'Failed to update case status')
      }
    } catch (error: any) {
      console.error('Error updating case status:', error)
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update case status. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsUpdating(false)
    }
  }

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
          <DialogTitle>Update Case Status</DialogTitle>
          <DialogDescription>
            Update the status for case: <strong>{selectedCase?.title}</strong>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Case Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select case status" />
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
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Status
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
