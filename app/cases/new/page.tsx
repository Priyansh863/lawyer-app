"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { getClientsAndLawyers } from "@/lib/api/users-api"
import { createCase } from "@/lib/api/cases-api"
import { ArrowLeft, Loader2, Plus, UserPlus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Sidebar from "@/components/sidebar/sidebar"
import { useTranslation } from "@/hooks/useTranslation"

const newCaseSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title must be less than 100 characters"),
  clientId: z.string(),
  description: z.string().optional(),
  status: z.enum(["pending", "approved", "rejected"]).default("pending"),
  assignedTo: z.array(z.string())
})

type NewCaseFormData = z.infer<typeof newCaseSchema>

export default function NewCasePage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [clients, setClients] = useState<{ id: string; name: string }[]>([])
  const [lawyers, setLawyers] = useState<{ id: string; name: string }[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isLawyer, setIsLawyer] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [showClientOnboarding, setShowClientOnboarding] = useState(false)
  const [newClientData, setNewClientData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  })

  const router = useRouter()
  const { toast } = useToast()
  const { t } = useTranslation()

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}")
    setCurrentUser(user)
    setIsLawyer(user.account_type === "lawyer")
    setIsClient(user.account_type === "client")
    
    const fetchData = async () => {
      try {
        const res = await getClientsAndLawyers()

        const formattedClients = res.clients.map((c: any) => ({
          id: c._id,
          name: `${c.first_name} ${c.last_name || ""}`,
        }))

        const formattedLawyers = res.lawyers.map((l: any) => ({
          id: l._id,
          name: `${l.first_name} ${l.last_name || ""}`,
        }))

        if (user.account_type === "client") {
          setClients([{ 
            id: user._id, 
            name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email 
          }])
          setLawyers(formattedLawyers)
        } else if (user.account_type === "lawyer") {
          setLawyers([{ 
            id: user._id, 
            name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email 
          }])
          setClients(formattedClients)
        } else {
          setClients(formattedClients)
          setLawyers(formattedLawyers)
        }
      } catch (err) {
        console.error("Error loading users:", err)
        toast({
          title: t("pages:newcases.errorLoadingTitle"),
          description: t("pages:newcases.errorLoadingDescription"),
          variant: "destructive",
        })
      }
    }

    fetchData()
  }, [])

  const form = useForm<NewCaseFormData>({
    resolver: zodResolver(newCaseSchema),
    defaultValues: {
      title: "",
      clientId: isClient ? currentUser?._id : "",
      description: "",
      status: "pending",
      assignedTo: isLawyer && currentUser?._id ? [currentUser._id] : [],
    },
  })

  const onSubmit = async (data: NewCaseFormData) => {
    setIsSubmitting(true)
    try {
      const clientId = isClient ? currentUser?._id : data.clientId
      const lawyerId = isLawyer ? currentUser?._id : data.assignedTo[0]
      
      if (!clientId || (!lawyerId && !isLawyer)) {
        throw new Error("Missing required user information")
      }

      const payload = {
        title: data.title,
        description: data.description,
        status: data.status.charAt(0).toUpperCase() + data.status.slice(1).toLowerCase(),
        client_id: clientId,
        lawyer_id: lawyerId,
        summary: t("pages:newcases.summaryAuto", { title: data.title }),
        key_points: [
          `${t("pages:newcases.statusLabel")}: ${data.status}`,
          `${t("pages:newcases.createdBy")}: ${currentUser?.first_name || currentUser?.email || t("pages:newcases.user")}`,
          `${t("pages:newcases.createdAt")}: ${new Date().toLocaleDateString()}`
        ],
      }

      const res = await createCase(payload)

      toast({
        title: t("pages:newcases.successTitle"),
        description: t("pages:newcases.successDescription", { caseTitle: res.case.title }),
      })

      router.push("/cases")
    } catch (error) {
      toast({
        title: t("pages:newcases.errorTitle"),
        description: t("pages:newcases.errorDescription"),
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBack = () => {
    router.push("/cases")
  }

  const handleCreateNewClient = async () => {
    try {
      setIsSubmitting(true)
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: newClientData.firstName,
          last_name: newClientData.lastName,
          email: newClientData.email,
          phone: newClientData.phone,
          account_type: 'client',
          password: 'TempPassword123!',
        }),
      })

      const result = await response.json()

      if (result.success) {
        const otpResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/send-signup-otp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: newClientData.email }),
        })

        const otpResult = await otpResponse.json()

        if (otpResult.success && otpResult.data?.otp) {
          toast({
            title: t("pages:newcases.clientOnboarding.clientCreatedTitle"),
            description: t("pages:newcases.clientOnboarding.otpSent", { 
              email: newClientData.email, 
              otp: otpResult.data.otp 
            }),
            duration: 10000,
          })
        }

        const newClient = {
          id: result.data.user._id,
          name: `${newClientData.firstName} ${newClientData.lastName}`,
        }
        setClients([...clients, newClient])
        
        form.setValue('clientId', newClient.id)
        
        setNewClientData({ firstName: '', lastName: '', email: '', phone: '' })
        setShowClientOnboarding(false)
        
        toast({
          title: t("pages:newcases.clientOnboarding.clientOnboardedTitle"),
          description: t("pages:newcases.clientOnboarding.clientOnboardedDescription"),
        })
      } else {
        throw new Error(result.message || t("pages:newcases.clientOnboarding.creationFailed"))
      }
    } catch (error: any) {
      console.error('Client creation error:', error)
      toast({
        title: t("pages:newcases.clientOnboarding.errorTitle"),
        description: error.message || t("pages:newcases.clientOnboarding.errorDescription"),
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 container mx-auto px-4 py-6 max-w-5xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="mb-4 p-0 h-auto font-normal text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("pages:newcases.backButton")}
          </Button>
          <h1 className="text-3xl font-bold">{t("pages:newcases.pageTitle")}</h1>
          <p className="text-muted-foreground mt-2">{t("pages:newcases.pageSubtitle")}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("pages:newcases.cardTitle")}</CardTitle>
            <CardDescription>{t("pages:newcases.cardDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-6">

                    {/* Title */}
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("pages:newcases.form.title")}</FormLabel>
                          <FormControl>
                            <Input placeholder={t("pages:newcases.form.titlePlaceholder")} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Client */}
                    <FormField
                      control={form.control}
                      name="clientId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("pages:newcases.form.client")}</FormLabel>
                          {isClient ? (
                            <div className="flex items-center p-2 border rounded-md bg-gray-50">
                              <span className="text-sm">
                                {currentUser?.first_name || currentUser?.email || t("pages:newcases.you")}
                              </span>
                              <input type="hidden" {...field} />
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                                disabled={isLawyer && clients.length === 1}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder={t("pages:newcases.form.selectClient")} />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {clients.map((client) => (
                                    <SelectItem key={client.id} value={client.id}>
                                      {client.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              
                              {/* Add New Client Button */}
                              {isLawyer && (
                                <Dialog open={showClientOnboarding} onOpenChange={setShowClientOnboarding}>
                                  <DialogTrigger asChild>
                                    <Button type="button" variant="outline" size="sm" className="w-full">
                                      <UserPlus className="h-4 w-4 mr-2" />
                                      {t("pages:newcases.clientOnboarding.addNewClient")}
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="sm:max-w-md">
                                    <DialogHeader>
                                      <DialogTitle>{t("pages:newcases.clientOnboarding.dialogTitle")}</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <Label htmlFor="firstName">
                                            {t("pages:newcases.clientOnboarding.firstName")}
                                          </Label>
                                          <Input
                                            id="firstName"
                                            value={newClientData.firstName}
                                            onChange={(e) => setNewClientData({...newClientData, firstName: e.target.value})}
                                            placeholder={t("pages:newcases.clientOnboarding.firstNamePlaceholder")}
                                          />
                                        </div>
                                        <div>
                                          <Label htmlFor="lastName">
                                            {t("pages:newcases.clientOnboarding.lastName")}
                                          </Label>
                                          <Input
                                            id="lastName"
                                            value={newClientData.lastName}
                                            onChange={(e) => setNewClientData({...newClientData, lastName: e.target.value})}
                                            placeholder={t("pages:newcases.clientOnboarding.lastNamePlaceholder")}
                                          />
                                        </div>
                                      </div>
                                      <div>
                                        <Label htmlFor="email">
                                          {t("pages:newcases.clientOnboarding.email")}
                                        </Label>
                                        <Input
                                          id="email"
                                          type="email"
                                          value={newClientData.email}
                                          onChange={(e) => setNewClientData({...newClientData, email: e.target.value})}
                                          placeholder={t("pages:newcases.clientOnboarding.emailPlaceholder")}
                                        />
                                      </div>
                                      <div>
                                        <Label htmlFor="phone">
                                          {t("pages:newcases.clientOnboarding.phone")}
                                        </Label>
                                        <Input
                                          id="phone"
                                          value={newClientData.phone}
                                          onChange={(e) => setNewClientData({...newClientData, phone: e.target.value})}
                                          placeholder={t("pages:newcases.clientOnboarding.phonePlaceholder")}
                                        />
                                      </div>
                                      <div className="flex gap-2">
                                        <Button 
                                          type="button" 
                                          onClick={handleCreateNewClient}
                                          disabled={!newClientData.firstName || !newClientData.email || isSubmitting}
                                          className="flex-1"
                                        >
                                          {isSubmitting ? (
                                            <>
                                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                              {t("pages:newcases.clientOnboarding.creating")}
                                            </>
                                          ) : (
                                            <>
                                              <Plus className="h-4 w-4 mr-2" />
                                              {t("pages:newcases.clientOnboarding.createClient")}
                                            </>
                                          )}
                                        </Button>
                                        <Button 
                                          type="button" 
                                          variant="outline" 
                                          onClick={() => setShowClientOnboarding(false)}
                                          disabled={isSubmitting}
                                        >
                                          {t("pages:newcases.clientOnboarding.cancel")}
                                        </Button>
                                      </div>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              )}
                            </div>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Assigned To */}
                    <FormField
                      control={form.control}
                      name="assignedTo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("pages:newcases.form.assignedTo")}</FormLabel>
                          {isLawyer ? (
                            <div className="flex items-center p-2 border rounded-md bg-gray-50">
                              <span className="text-sm">
                                {currentUser?.first_name || currentUser?.email || t("pages:newcases.you")}
                              </span>
                              <input type="hidden" {...field} value={currentUser?._id} />
                            </div>
                          ) : (
                            <Select
                              onValueChange={(value) => field.onChange([value])}
                              defaultValue={field.value?.[0]}
                              disabled={isClient && lawyers.length === 1}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t("pages:newcases.form.selectLawyer")} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {lawyers.map((lawyer) => (
                                  <SelectItem key={lawyer.id} value={lawyer.id}>
                                    {lawyer.name} 
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Status */}
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("pages:newcases.form.status")}</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t("pages:newcases.form.selectStatus")} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="pending">{t("pages:newcases.status.pending")}</SelectItem>
                              <SelectItem value="approved">{t("pages:newcases.status.approved")}</SelectItem>
                              <SelectItem value="rejected">{t("pages:newcases.status.rejected")}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Description */}
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>{t("pages:newcases.form.description")}</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t("pages:newcases.form.descriptionPlaceholder")}
                              className="min-h-[120px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-6">
                  <Button type="submit" disabled={isSubmitting} className="flex-1 sm:flex-none">
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t("pages:newcases.buttons.create")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 sm:flex-none"
                    onClick={() => router.push('/cases')}
                  >
                    {t("pages:newcases.buttons.cancel")}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}