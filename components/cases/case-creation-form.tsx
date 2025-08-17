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

const caseCreationSchema = z.object({
  title: z.string().min(1, "Case title is required").max(200, "Title must be less than 200 characters"),
  description: z.string().min(10, "Description must be at least 10 characters").max(1000, "Description must be less than 1000 characters"),
  case_type: z.enum([
    "civil", "criminal", "family", "corporate", "immigration", 
    "personal_injury", "real_estate", "intellectual_property", 
    "employment", "tax", "bankruptcy", "other"
  ] as const, {
    required_error: "Please select a case type"
  }),
  court_type: z.enum([
    "district_court", "high_court", "supreme_court", "family_court", 
    "commercial_court", "consumer_court", "labor_court", "tax_court", 
    "tribunal", "arbitration", "other"
  ] as const, {
    required_error: "Please select a court type"
  }),
  // Client selection or onboarding
  client_option: z.enum(["existing", "new"]).default("existing"),
  existing_client_id: z.string().optional(),
  // New client onboarding fields
  client_first_name: z.string().optional(),
  client_last_name: z.string().optional(),
  client_email: z.string().email("Please enter a valid email address").optional().or(z.literal("")),
  client_phone: z.string().optional(),
  client_password: z.string().optional(),
  // Case details
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  expected_duration: z.string().optional(),
  notes: z.string().max(500, "Notes must be less than 500 characters").optional()
}).refine((data) => {
  console.log('Validation refinement check:', {
    client_option: data.client_option,
    existing_client_id: data.existing_client_id,
    client_first_name: data.client_first_name,
    client_email: data.client_email,
    client_password: data.client_password
  })
  
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
  const { toast } = useToast()
  const { t } = useTranslation()
  const profile = useSelector((state: RootState) => state.auth.user)
  const token = useSelector((state: RootState) => state.auth.token)

  const form = useForm<CaseCreationData>({
    resolver: zodResolver(caseCreationSchema),
    defaultValues: {
      title: "",
      description: "",
      case_type: undefined,
      court_type: undefined,
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

  // Fetch clients when dialog opens
  useEffect(() => {
    if (isOpen && profile?.account_type === 'lawyer') {
      fetchClients()
    }
  }, [isOpen, profile])

  const fetchClients = async () => {
    try {
      setLoadingClients(true)
      const clientsData = await getClients({ limit: 100 }) // Get more clients
      setClients(clientsData)
    } catch (error: any) {
      console.error('Error fetching clients:', error)
      toast({
        title: "Error",
        description: "Failed to load clients",
        variant: "destructive"
      })
    } finally {
      setLoadingClients(false)
    }
  }

  const onSubmit = async (data: CaseCreationData) => {
    console.log('Form submission data:', data)
    console.log('Form validation errors:', form.formState.errors)
    
    if (!token) {
      toast({
        title: "Authentication Error",
        description: "Please log in to create a case",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      const caseData = {
        ...data,
        lawyer_id: profile?._id,
        status: "open" as const,
        // Clean up empty optional fields
        client_email: data.client_email || undefined,
        client_phone: data.client_phone || undefined,
        expected_duration: data.expected_duration || undefined,
        notes: data.notes || undefined
      }

      const response = await createCase(caseData)
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Case created successfully",
          variant: "default"
        })
        
        form.reset()
        setIsOpen(false)
        onCaseCreated?.()
      } else {
        throw new Error("Failed to create case")
      }
    } catch (error: any) {
      console.error("Error creating case:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to create case. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const priorityOptions = [
    { value: "low", label: "Low", color: "bg-green-100 text-green-800" },
    { value: "medium", label: "Medium", color: "bg-yellow-100 text-yellow-800" },
    { value: "high", label: "High", color: "bg-orange-100 text-orange-800" },
    { value: "urgent", label: "Urgent", color: "bg-red-100 text-red-800" }
  ]

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create New Case
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Case</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Case Information</h3>
              
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Case Title *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter case title" {...field} />
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
                    <FormLabel>Case Description *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Provide a detailed description of the case"
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
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
                      <FormLabel>Case Type *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select case type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(caseTypeConfig).map(([key, config]) => (
                            <SelectItem key={key} value={key}>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-x1 rounded-full text-xs ${config.color}`}>
                                  {config.label}
                                </span>
                              </div>
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
                  name="court_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Court Type *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select court type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(courtTypeConfig).map(([key, config]) => (
                            <SelectItem key={key} value={key}>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 rounded-full text-xs ${config.color}`}>
                                  {config.label}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Client Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Client Information</h3>
              
              <FormField
                control={form.control}
                name="client_option"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client Selection *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select client option" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="existing">Select Existing Client</SelectItem>
                        <SelectItem value="new">Create New Client</SelectItem>
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
                      <FormLabel>Select Client *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose existing client" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {loadingClients ? (
                            <SelectItem value="" disabled>
                              Loading clients...
                            </SelectItem>
                          ) : clients.length === 0 ? (
                            <SelectItem value="" disabled>
                              No clients found
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
                          <FormLabel>First Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter first name" {...field} />
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
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter last name" {...field} />
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
                          <FormLabel>Client Email *</FormLabel>
                          <FormControl>
                            <Input 
                              type="email" 
                              placeholder="client@example.com" 
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
                          <FormLabel>Client Phone</FormLabel>
                          <FormControl>
                            <Input 
                              type="tel" 
                              placeholder="+1 (555) 123-4567" 
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
                        <FormLabel>Password *</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="Enter password for new client" 
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
              <h3 className="text-lg font-semibold">Case Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority Level</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {priorityOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 rounded-full text-xs ${option.color}`}>
                                  {option.label}
                                </span>
                              </div>
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
                      <FormLabel>Expected Duration</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., 3-6 months" 
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
                    <FormLabel>Additional Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Any additional information or special considerations"
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
                Cancel
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  console.log('Current form values:', form.getValues())
                  console.log('Form errors:', form.formState.errors)
                  console.log('Form is valid:', form.formState.isValid)
                }}
              >
                Debug Form
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Case"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
