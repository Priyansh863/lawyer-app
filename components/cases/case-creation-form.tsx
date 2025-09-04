"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/hooks/useTranslation"
import { createCase } from "@/lib/api/cases-api"
import { getClients } from "@/lib/api/clients-api"
import { useSelector } from "react-redux"
import { RootState } from "@/lib/store"
import { Plus, Loader2 } from "lucide-react"
import { CaseType, CourtType, caseTypeConfig, courtTypeConfig } from "@/types/case"
import { IUser } from "@/lib/slices/authSlice"
import { Client } from "@/types/client"

// Court-Case Type-Code mapping based on Korean court system
const courtCaseMapping = {
  "Seoul Central District Court": {
    "Criminal": ["Go", "GoHap", "Hyeong", "Criminal", "HyeongJe", "No", "NoHap", "Do", "DoHap", "Hang", "Appeal", "HangHap", "Jae", "JaeHang", "JaeHap"],
    "Civil": ["Ga", "GaHap", "GaDan", "GaSo", "GaCheo", "Car", "CarHap", "CarDan", "Na", "NaHap", "NaDan", "Ba", "BaHap", "BaDan", "Ha", "Ma", "Ta", "TaHap", "TaDan"]
  },
  "Seoul Eastern District Court": {
    "Criminal": ["Go", "GoHap", "Hyeong", "Criminal", "HyeongJe", "No", "NoHap", "Do", "DoHap", "Hang", "Appeal", "HangHap", "Jae", "JaeHang", "JaeHap"],
    "Civil": ["Ga", "GaHap", "GaDan", "GaSo", "GaCheo", "Car", "CarHap", "CarDan", "Na", "NaHap", "NaDan", "Ba", "BaHap", "BaDan", "Ha", "Ma", "Ta", "TaHap", "TaDan"]
  },
  "Seoul Western District Court": {
    "Criminal": ["Go", "GoHap", "Hyeong", "Criminal", "HyeongJe", "No", "NoHap", "Do", "DoHap", "Hang", "Appeal", "HangHap", "Jae", "JaeHang", "JaeHap"],
    "Civil": ["Ga", "GaHap", "GaDan", "GaSo", "GaCheo", "Car", "CarHap", "CarDan", "Na", "NaHap", "NaDan", "Ba", "BaHap", "BaDan", "Ha", "Ma", "Ta", "TaHap", "TaDan"]
  },
  "Seoul Southern District Court": {
    "Criminal": ["Go", "GoHap", "Hyeong", "Criminal", "HyeongJe", "No", "NoHap", "Do", "DoHap", "Hang", "Appeal", "HangHap", "Jae", "JaeHang", "JaeHap"],
    "Civil": ["Ga", "GaHap", "GaDan", "GaSo", "GaCheo", "Car", "CarHap", "CarDan", "Na", "NaHap", "NaDan", "Ba", "BaHap", "BaDan", "Ha", "Ma", "Ta", "TaHap", "TaDan"]
  },
  "Seoul Northern District Court": {
    "Criminal": ["Go", "GoHap", "Hyeong", "Criminal", "HyeongJe", "No", "NoHap", "Do", "DoHap", "Hang", "Appeal", "HangHap", "Jae", "JaeHang", "JaeHap"],
    "Civil": ["Ga", "GaHap", "GaDan", "GaSo", "GaCheo", "Car", "CarHap", "CarDan", "Na", "NaHap", "NaDan", "Ba", "BaHap", "BaDan", "Ha", "Ma", "Ta", "TaHap", "TaDan"]
  },
  "Incheon District Court": {
    "Criminal": ["Go", "GoHap", "Hyeong", "Criminal", "HyeongJe", "No", "NoHap", "Do", "DoHap", "Hang", "Appeal", "HangHap", "Jae", "JaeHang", "JaeHap"],
    "Civil": ["Ga", "GaHap", "GaDan", "GaSo", "GaCheo", "Car", "CarHap", "CarDan", "Na", "NaHap", "NaDan", "Ba", "BaHap", "BaDan", "Ha", "Ma", "Ta", "TaHap", "TaDan"]
  },
  "Suwon District Court": {
    "Criminal": ["Go", "GoHap", "Hyeong", "Criminal", "HyeongJe", "No", "NoHap", "Do", "DoHap", "Hang", "Appeal", "HangHap", "Jae", "JaeHang", "JaeHap"],
    "Civil": ["Ga", "GaHap", "GaDan", "GaSo", "GaCheo", "Car", "CarHap", "CarDan", "Na", "NaHap", "NaDan", "Ba", "BaHap", "BaDan", "Ha", "Ma", "Ta", "TaHap", "TaDan"]
  },
  "Uijeongbu District Court": {
    "Criminal": ["Go", "GoHap", "Hyeong", "Criminal", "HyeongJe", "No", "NoHap", "Do", "DoHap", "Hang", "Appeal", "HangHap", "Jae", "JaeHang", "JaeHap"],
    "Civil": ["Ga", "GaHap", "GaDan", "GaSo", "GaCheo", "Car", "CarHap", "CarDan", "Na", "NaHap", "NaDan", "Ba", "BaHap", "BaDan", "Ha", "Ma", "Ta", "TaHap", "TaDan"]
  },
  "Chuncheon District Court": {
    "Criminal": ["Go", "GoHap", "Hyeong", "Criminal", "HyeongJe", "No", "NoHap", "Do", "DoHap", "Hang", "Appeal", "HangHap", "Jae", "JaeHang", "JaeHap"],
    "Civil": ["Ga", "GaHap", "GaDan", "GaSo", "GaCheo", "Car", "CarHap", "CarDan", "Na", "NaHap", "NaDan", "Ba", "BaHap", "BaDan", "Ha", "Ma", "Ta", "TaHap", "TaDan"]
  },
  "Cheongju District Court": {
    "Criminal": ["Go", "GoHap", "Hyeong", "Criminal", "HyeongJe", "No", "NoHap", "Do", "DoHap", "Hang", "Appeal", "HangHap", "Jae", "JaeHang", "JaeHap"],
    "Civil": ["Ga", "GaHap", "GaDan", "GaSo", "GaCheo", "Car", "CarHap", "CarDan", "Na", "NaHap", "NaDan", "Ba", "BaHap", "BaDan", "Ha", "Ma", "Ta", "TaHap", "TaDan"]
  },
  "Daejeon District Court": {
    "Criminal": ["Go", "GoHap", "Hyeong", "Criminal", "HyeongJe", "No", "NoHap", "Do", "DoHap", "Hang", "Appeal", "HangHap", "Jae", "JaeHang", "JaeHap"],
    "Civil": ["Ga", "GaHap", "GaDan", "GaSo", "GaCheo", "Car", "CarHap", "CarDan", "Na", "NaHap", "NaDan", "Ba", "BaHap", "BaDan", "Ha", "Ma", "Ta", "TaHap", "TaDan"]
  },
  "Daegu District Court": {
    "Criminal": ["Go", "GoHap", "Hyeong", "Criminal", "HyeongJe", "No", "NoHap", "Do", "DoHap", "Hang", "Appeal", "HangHap", "Jae", "JaeHang", "JaeHap"],
    "Civil": ["Ga", "GaHap", "GaDan", "GaSo", "GaCheo", "Car", "CarHap", "CarDan", "Na", "NaHap", "NaDan", "Ba", "BaHap", "BaDan", "Ha", "Ma", "Ta", "TaHap", "TaDan"]
  },
  "Busan District Court": {
    "Criminal": ["Go", "GoHap", "Hyeong", "Criminal", "HyeongJe", "No", "NoHap", "Do", "DoHap", "Hang", "Appeal", "HangHap", "Jae", "JaeHang", "JaeHap"],
    "Civil": ["Ga", "GaHap", "GaDan", "GaSo", "GaCheo", "Car", "CarHap", "CarDan", "Na", "NaHap", "NaDan", "Ba", "BaHap", "BaDan", "Ha", "Ma", "Ta", "TaHap", "TaDan"]
  },
  "Ulsan District Court": {
    "Criminal": ["Go", "GoHap", "Hyeong", "Criminal", "HyeongJe", "No", "NoHap", "Do", "DoHap", "Hang", "Appeal", "HangHap", "Jae", "JaeHang", "JaeHap"],
    "Civil": ["Ga", "GaHap", "GaDan", "GaSo", "GaCheo", "Car", "CarHap", "CarDan", "Na", "NaHap", "NaDan", "Ba", "BaHap", "BaDan", "Ha", "Ma", "Ta", "TaHap", "TaDan"]
  },
  "Gwangju District Court": {
    "Criminal": ["Go", "GoHap", "Hyeong", "Criminal", "HyeongJe", "No", "NoHap", "Do", "DoHap", "Hang", "Appeal", "HangHap", "Jae", "JaeHang", "JaeHap"],
    "Civil": ["Ga", "GaHap", "GaDan", "GaSo", "GaCheo", "Car", "CarHap", "CarDan", "Na", "NaHap", "NaDan", "Ba", "BaHap", "BaDan", "Ha", "Ma", "Ta", "TaHap", "TaDan"]
  },
  "Changwon District Court": {
    "Criminal": ["Go", "GoHap", "Hyeong", "Criminal", "HyeongJe", "No", "NoHap", "Do", "DoHap", "Hang", "Appeal", "HangHap", "Jae", "JaeHang", "JaeHap"],
    "Civil": ["Ga", "GaHap", "GaDan", "GaSo", "GaCheo", "Car", "CarHap", "CarDan", "Na", "NaHap", "NaDan", "Ba", "BaHap", "BaDan", "Ha", "Ma", "Ta", "TaHap", "TaDan"]
  },
  "Jeju District Court": {
    "Criminal": ["Go", "GoHap", "Hyeong", "Criminal", "HyeongJe", "No", "NoHap", "Do", "DoHap", "Hang", "Appeal", "HangHap", "Jae", "JaeHang", "JaeHap"],
    "Civil": ["Ga", "GaHap", "GaDan", "GaSo", "GaCheo", "Car", "CarHap", "CarDan", "Na", "NaHap", "NaDan", "Ba", "BaHap", "BaDan", "Ha", "Ma", "Ta", "TaHap", "TaDan"]
  },
  "Seoul High Court": {
    "Criminal": ["Go", "GoHap", "Hyeong", "Criminal", "HyeongJe", "No", "NoHap", "Do", "DoHap", "Hang", "Appeal", "HangHap", "Jae", "JaeHang", "JaeHap"],
    "Civil": ["Ga", "GaHap", "GaDan", "GaSo", "GaCheo", "Car", "CarHap", "CarDan", "Na", "NaHap", "NaDan", "Ba", "BaHap", "BaDan", "Ha", "Ma", "Ta", "TaHap", "TaDan"]
  },
  "Daejeon High Court": {
    "Criminal": ["Go", "GoHap", "Hyeong", "Criminal", "HyeongJe", "No", "NoHap", "Do", "DoHap", "Hang", "Appeal", "HangHap", "Jae", "JaeHang", "JaeHap"],
    "Civil": ["Ga", "GaHap", "GaDan", "GaSo", "GaCheo", "Car", "CarHap", "CarDan", "Na", "NaHap", "NaDan", "Ba", "BaHap", "BaDan", "Ha", "Ma", "Ta", "TaHap", "TaDan"]
  },
  "Daegu High Court": {
    "Criminal": ["Go", "GoHap", "Hyeong", "Criminal", "HyeongJe", "No", "NoHap", "Do", "DoHap", "Hang", "Appeal", "HangHap", "Jae", "JaeHang", "JaeHap"],
    "Civil": ["Ga", "GaHap", "GaDan", "GaSo", "GaCheo", "Car", "CarHap", "CarDan", "Na", "NaHap", "NaDan", "Ba", "BaHap", "BaDan", "Ha", "Ma", "Ta", "TaHap", "TaDan"]
  },
  "Busan High Court": {
    "Criminal": ["Go", "GoHap", "Hyeong", "Criminal", "HyeongJe", "No", "NoHap", "Do", "DoHap", "Hang", "Appeal", "HangHap", "Jae", "JaeHang", "JaeHap"],
    "Civil": ["Ga", "GaHap", "GaDan", "GaSo", "GaCheo", "Car", "CarHap", "CarDan", "Na", "NaHap", "NaDan", "Ba", "BaHap", "BaDan", "Ha", "Ma", "Ta", "TaHap", "TaDan"]
  },
  "Gwangju High Court": {
    "Criminal": ["Go", "GoHap", "Hyeong", "Criminal", "HyeongJe", "No", "NoHap", "Do", "DoHap", "Hang", "Appeal", "HangHap", "Jae", "JaeHang", "JaeHap"],
    "Civil": ["Ga", "GaHap", "GaDan", "GaSo", "GaCheo", "Car", "CarHap", "CarDan", "Na", "NaHap", "NaDan", "Ba", "BaHap", "BaDan", "Ha", "Ma", "Ta", "TaHap", "TaDan"]
  },
  "Constitutional Court": {
    "Constitutional": ["Constitution"]
  },
  "Supreme Court": {
    "Appeal (Supreme)": ["SupremeAppeal"]
  },
  "Seoul Family Court": {
    "Family": ["Deu", "GaHap", "GaDan", "Ga", "Family", "GaJae", "GaShin", "GaCheo"]
  }
} as const

// Define case status options grouped by category
const caseStatusOptions = {
  active: [
    { value: "pending", label: "pages:cases.status.pending" },
    { value: "in_progress", label: "pages:cases.status.inProgress" }
  ],
  judgment: [
    { value: "full_win", label: "pages:cases.status.fullWin" },
    { value: "full_loss", label: "pages:cases.status.fullLoss" },
    { value: "partial_win", label: "pages:cases.status.partialWin" },
    { value: "partial_loss", label: "pages:cases.status.partialLoss" },
    { value: "dismissal", label: "pages:cases.status.dismissal" },
    { value: "rejection", label: "pages:cases.status.rejection" }
  ],
  nonJudgment: [
    { value: "withdrawal", label: "pages:cases.status.withdrawal" },
    { value: "mediation", label: "pages:cases.status.mediation" },
    { value: "settlement", label: "pages:cases.status.settlement" },
    { value: "trial_cancellation", label: "pages:cases.status.trialCancellation" },
    { value: "suspension", label: "pages:cases.status.suspension" },
    { value: "closure", label: "pages:cases.status.closure" }
  ]
} as const

const caseCreationSchema = z.object({
  title: z.string().min(1, "Case title is required").max(200, "Title must be less than 200 characters"),
  description: z.string().min(10, "Description must be at least 10 characters").max(1000, "Description must be less than 1000 characters"),
  court_name: z.string().min(1, "Please select a court"),
  case_type: z.string().min(1, "Please select a case type"),
  case_code: z.string().min(1, "Please select a case code"),
  case_number: z.string().min(1, "Case number is required").max(50, "Case number must be less than 50 characters"),
  case_status: z.enum([
    "pending", "in_progress", "full_win", "full_loss", "partial_win", 
    "partial_loss", "dismissal", "rejection", "withdrawal", "mediation", 
    "settlement", "trial_cancellation", "suspension", "closure"
  ]).default("pending"),
  client_option: z.enum(["existing", "new"]).default("existing"),
  existing_client_id: z.string().optional(),
  client_first_name: z.string().optional(),
  client_last_name: z.string().optional(),
  client_email: z.string().email("Please enter a valid email address").optional().or(z.literal("")),
  client_phone: z.string().optional(),
  client_password: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  expected_duration: z.string().optional(),
  notes: z.string().max(500, "Notes must be less than 500 characters").optional()
}).refine((data) => {
  if (data.client_option === "existing") {
    return !!data.existing_client_id;
  } else {
    return !!(data.client_first_name && data.client_email && data.client_password);
  }
}, {
  message: "Please select an existing client or provide new client details",
  path: ["existing_client_id"]
})

type CaseCreationData = z.infer<typeof caseCreationSchema>

interface CaseCreationFormProps {
  onCaseCreated?: () => void
}

export default function CaseCreationForm({ onCaseCreated }: CaseCreationFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [loadingClients, setLoadingClients] = useState(false)
  const [availableCaseTypes, setAvailableCaseTypes] = useState<string[]>([])
  const [availableCaseCodes, setAvailableCaseCodes] = useState<string[]>([])
  const { toast } = useToast()
  const { t } = useTranslation()
  const profile = useSelector((state: RootState) => state.auth.user)
  const token = useSelector((state: RootState) => state.auth.token)

  const form = useForm<CaseCreationData>({
    resolver: zodResolver(caseCreationSchema),
    defaultValues: {
      title: "",
      description: "",
      court_name: "",
      case_type: "",
      case_code: "",
      case_number: "",
      case_status: "pending",
      client_option: "existing",
      existing_client_id: "",
      client_first_name: "",
      client_last_name: "",
      client_email: "",
      client_phone: "",
      client_password: "",
      priority: "medium",
      expected_duration: "",
      notes: ""
    }
  })

  useEffect(() => {
    if (isOpen && profile?.account_type === 'lawyer') {
      fetchClients()
    }
  }, [isOpen, profile])

  // Handle court selection to update available case types and codes
  useEffect(() => {
    const courtName = form.watch("court_name");
    if (courtName && courtCaseMapping[courtName as keyof typeof courtCaseMapping]) {
      const courtData = courtCaseMapping[courtName as keyof typeof courtCaseMapping];
      const caseTypes = Object.keys(courtData);
      setAvailableCaseTypes(caseTypes);
      
      // Reset case type and case code when court changes
      form.setValue("case_type", "");
      form.setValue("case_code", "");
      setAvailableCaseCodes([]);
    } else {
      setAvailableCaseTypes([]);
      setAvailableCaseCodes([]);
    }
  }, [form.watch("court_name")]);

  // Handle case type selection to update available case codes
  useEffect(() => {
    const courtName = form.watch("court_name");
    const caseType = form.watch("case_type");
    
    if (courtName && caseType && courtCaseMapping[courtName as keyof typeof courtCaseMapping]) {
      const courtData = courtCaseMapping[courtName as keyof typeof courtCaseMapping];
      const caseCodes = courtData[caseType as keyof typeof courtData] || [];
      setAvailableCaseCodes(caseCodes as string[]);
      
      // Reset case code when case type changes
      form.setValue("case_code", "");
    } else {
      setAvailableCaseCodes([]);
    }
  }, [form.watch("court_name"), form.watch("case_type")]);

  const fetchClients = async () => {
    try {
      setLoadingClients(true)
      const clientsData = await getClients({ limit: 100 })
      setClients(clientsData)
    } catch (error: any) {
      console.error('Error fetching clients:', error)
      toast({
        title: t("common.error"),
        description: t("pages:casesD.error.fetchingClients"),
        variant: "destructive"
      })
    } finally {
      setLoadingClients(false)
    }
  }

  const onSubmit = async (data: CaseCreationData) => {
    if (!token) {
      toast({
        title: t("auth.error.authentication"),
        description: t("auth.error.loginRequired"),
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      // Assemble case identification: court + case code + case number
      const courtAbbreviation = data.court_name.split(' ').map(word => word.charAt(0)).join('').toUpperCase();
      const caseIdentifier = `${courtAbbreviation}-${data.case_code}-${data.case_number}`;

      const caseData = {
        ...data,
        case_identifier: caseIdentifier,
        lawyer_id: profile?._id,
        status: data.case_status,
        court_name: data.court_name,
        court_type: data.court_name, // Send court_name as court_type for backend compatibility
        client_email: data.client_email || undefined,
        client_phone: data.client_phone || undefined,
        expected_duration: data.expected_duration || undefined,
        notes: data.notes || undefined
      }

      const response = await createCase(caseData)
      
      if (response.success) {
        toast({
          title: t("pages:commona.success"),
          description: t("pages:casesD.success.caseCreated"),
          variant: "default"
        })
        
        form.reset()
        setIsOpen(false)
        onCaseCreated?.()
      } else {
        throw new Error(t("pages:casesD.error.createFailed"))
      }
    } catch (error: any) {
      console.error("Error creating case:", error)
      toast({
        title: t("common.error"),
        description: error.message || t("pages:casesD.error.tryAgain"),
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const priorityOptions = [
    { value: "low", label: t("pages:casesD.priority.low") },
    { value: "medium", label: t("pages:casesD.priority.medium") },
    { value: "high", label: t("pages:casesD.priority.high") },
    { value: "urgent", label: t("pages:casesD.priority.urgent") }
  ]

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          {t("pages:casesD.createNewCase")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("pages:casesD.createNewCase")}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{t("pages:casesD.caseInformation")}</h3>
              
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("pages:casesD.form.title")} *</FormLabel>
                    <FormControl>
                      <Input placeholder={t("pages:casesD.form.titlePlaceholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("pages:casesD.form.description")} *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder={t("pages:casesD.form.descriptionPlaceholder")}
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="court_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("pages:casesD.form.courtType")} *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                         <SelectValue placeholder={t("pages:casesD.form.selectCourt")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.keys(courtCaseMapping).map((courtName) => (
                         <SelectItem key={courtName} value={courtName}>
  {t(`common:courtTypes.${courtName}`)}
</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="case_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("pages:casesD.form.caseType")} *</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                        disabled={availableCaseTypes.length === 0}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue 
  placeholder={
    availableCaseTypes.length === 0 
      ? t("pages:casesD.form.selectCourtFirst") 
      : t("pages:casesD.form.selectCaseType")
  } 
/>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableCaseTypes.map((caseType) => (
                           <SelectItem key={caseType} value={caseType}>
  {t(`common:caseTypes.${caseType}`)}
</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="case_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("pages:casesD.form.caseCode")} *</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                        disabled={availableCaseCodes.length === 0}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue 
  placeholder={
    availableCaseCodes.length === 0 
      ? t("pages:casesD.form.selectCaseTypeFirst") 
      : t("pages:casesD.form.selectCaseCode")
  } 
/>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableCaseCodes.map((code) => (
                            <SelectItem key={code} value={code}>
  {t(`common:caseCodes.${code}`)}
</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>


              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="case_status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("pages:casesD.form.caseStatus")} *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("pages:casesD.form.selectCaseStatus")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {/* Active Case Statuses */}
                          {caseStatusOptions.active.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              {t(status.label)}
                            </SelectItem>
                          ))}
                          
                          {/* Judgment Outcomes */}
                          {caseStatusOptions.judgment.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              {t(status.label)}
                            </SelectItem>
                          ))}
                          
                          {/* Non-Judgment Outcomes */}
                          {caseStatusOptions.nonJudgment.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              {t(status.label)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="case_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("pages:casesD.form.caseNumber")} *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder={t("pages:casesD.form.caseNumberPlaceholder")} 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Display the assembled case identifier */}
              {form.watch("court_name") && form.watch("case_code") && form.watch("case_number") && (
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-sm font-medium">{t("pages:casesD.form.caseIdentifier")}:</p>
                  <p className="text-lg font-bold">
                    {form.watch("court_name")?.split(' ').map(word => word.charAt(0)).join('').toUpperCase()}-
                    {form.watch("case_code")}-
                    {form.watch("case_number")}
                  </p>
                </div>
              )}
            </div>

            {/* Client Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{t("pages:casesD.clientInformation")}</h3>
              
              <FormField
                control={form.control}
                name="client_option"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("pages:casesD.form.clientSelection")} *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("pages:casesD.form.selectClientOption")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="existing">{t("pages:casesD.form.existingClient")}</SelectItem>
                        <SelectItem value="new">{t("pages:casesD.form.newClient")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch("client_option") === "existing" && (
                <FormField
                  control={form.control}
                  name="existing_client_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("pages:casesD.form.selectClient")} *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("pages:casesD.form.chooseClient")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {loadingClients ? (
                            <SelectItem value="" disabled>
                              {t("cases.loadingClients")}
                            </SelectItem>
                          ) : clients.length === 0 ? (
                            <SelectItem value="" disabled>
                              {t("cases.noClientsFound")}
                            </SelectItem>
                          ) : (
                            clients.map((client) => (
                              <SelectItem key={client.id} value={client.id}>
                                {client.name} ({client.email})
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {form.watch("client_option") === "new" && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="client_first_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("cases.form.firstName")} *</FormLabel>
                          <FormControl>
                            <Input placeholder={t("pages:casesD.form.firstNamePlaceholder")} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="client_last_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("pages:casesD.form.lastName")}</FormLabel>
                          <FormControl>
                            <Input placeholder={t("pages:casesD.form.lastNamePlaceholder")} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="client_email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("pages:casesD.form.email")} *</FormLabel>
                          <FormControl>
                            <Input 
                              type="email" 
                              placeholder={t("pages:casesD.form.emailPlaceholder")} 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="client_phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("pages:casesD.form.phone")}</FormLabel>
                          <FormControl>
                            <Input 
                              type="tel" 
                              placeholder={t("pages:casesD.form.phonePlaceholder")} 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="client_password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("pages:casesD.form.password")} *</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder={t("pages:casesD.form.passwordPlaceholder")} 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </div>

            {/* Case Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{t("pages:casesD.caseDetails")}</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("pages:casesD.form.priority")}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("pages:casesD.form.selectPriority")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {priorityOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expected_duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("pages:casesD.form.expectedDuration")}</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder={t("pages:casesD.form.durationPlaceholder")} 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("pages:casesD.form.notes")}</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder={t("pages:casesD.form.notesPlaceholder")}
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isLoading}
              >
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("pages:casesD.creatingCase")}
                  </>
                ) : (
                  t("pages:casesD.createCase")
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}