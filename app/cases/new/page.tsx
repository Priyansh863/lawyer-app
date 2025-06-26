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
import { getClientsAndLawyers } from "@/lib/api/users-api";
import { createCase } from "@/lib/api/cases-api";
import { ArrowLeft, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Sidebar from "@/components/sidebar/sidebar" // ✅ Import Sidebar

const newCaseSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title must be less than 100 characters"),
  clientId: z.string().min(1, "Please select a client"),
  description: z.string().optional(),
  status: z.enum(["pending", "approved", "rejected"]).default("pending"),
  assignedTo: z.array(z.string()).min(1, "Please assign at least one person"),
})

type NewCaseFormData = z.infer<typeof newCaseSchema>


export default function NewCasePage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [lawyers, setLawyers] = useState<{ id: string; name: string }[]>([]);

  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
  const fetchData = async () => {
    try {
      const res = await getClientsAndLawyers();

      // Format to match your select structure
      const formattedClients = res.clients.map((c: any) => ({
        id: c._id,
        name: `${c.first_name} ${c.last_name || ""}`,
      }));

      const formattedLawyers = res.lawyers.map((l: any) => ({
        id: l._id,
        name: `${l.first_name} ${l.last_name || ""}`,
      }));
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (user.account_type == "client") {
        // Filter lawyers if the user is not a lawyer
        setClients([{ id: user._id, name: `${user.first_name} ${user.last_name || ""}` }]);
      }else{
        // If the user is a lawyer, show all clients
        setClients(formattedClients);
      }
      setLawyers(formattedLawyers);
    } catch (err) {
      toast({
        title: "Error loading users",
        description: "Make sure you're logged in and connected.",
        variant: "destructive",
      });
    }
  };

  fetchData();
}, []);


  const form = useForm<NewCaseFormData>({
    resolver: zodResolver(newCaseSchema),
    defaultValues: {
      title: "",
      clientId: "",
      description: "",
      status: "pending",
      assignedTo: [],
    },
  })

  const onSubmit = async (data: NewCaseFormData) => {
  setIsSubmitting(true);
  try {
    const payload = {
      title: data.title,
      description: data.description,
      status: data.status.charAt(0).toUpperCase() + data.status.slice(1).toLowerCase(),
      client_id: data.clientId,
      lawyer_id: data.assignedTo[0], // assuming one lawyer
      summary: "Auto-generated summary", // temporary placeholder
      key_points: ["Key point 1", "Key point 2"], // default or calculated
    };

    const res = await createCase(payload);

    toast({
      title: "Case Created ✅",
      description: `Case "${res.case.title}" has been created successfully.`,
    });

    router.push("/cases");
  } catch (error) {
    toast({
      title: "Error ❌",
      description: "Something went wrong while creating the case.",
      variant: "destructive",
    });
  } finally {
    setIsSubmitting(false);
  }
};

  const handleBack = () => {
    router.back()
  }

  return (
    <div className="flex">
      <Sidebar /> {/* ✅ Sidebar rendered on the left */}
      <div className="flex-1 container mx-auto px-4 py-6 max-w-5xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="mb-4 p-0 h-auto font-normal text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Create New Case</h1>
          <p className="text-muted-foreground mt-2">Fill in the details below to create a new case for your client.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Case Information</CardTitle>
            <CardDescription>Provide the basic information for the new case.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Case Title *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter case title" {...field} className="bg-background" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="clientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client *</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className="bg-background">
                              <SelectValue placeholder="Select a client" />
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter case description (optional)"
                          className="min-h-[100px] bg-background"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Initial Status</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className="bg-background">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="assignedTo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assign To *</FormLabel>
                        <Select value={field.value[0] || ""} onValueChange={(value) => field.onChange([value])}>
                          <FormControl>
                            <SelectTrigger className="bg-background">
                              <SelectValue placeholder="Select assignee" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {lawyers.map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-6">
                  <Button type="submit" disabled={isSubmitting} className="flex-1 sm:flex-none">
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isSubmitting ? "Creating Case..." : "Create Case"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    disabled={isSubmitting}
                    className="flex-1 sm:flex-none"
                  >
                    Cancel
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
