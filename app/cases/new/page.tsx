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
import { getClientsAndLawyers } from "@/lib/api/users-api"
import { createCase } from "@/lib/api/cases-api"
import { ArrowLeft, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Sidebar from "@/components/sidebar/sidebar"
import { useTranslation } from "@/hooks/useTranslation" // ✅ Added translation hook

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

  const router = useRouter()
  const { toast } = useToast()
  const { t } = useTranslation() // ✅ Initialize translations

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
    router.back()
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
