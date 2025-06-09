"use client"
import type { Client, ClientStatus } from "@/types/client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useSearchParams, useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { Star, Ban, MessageSquare, Loader2 } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { getClients, updateClientStatus, toggleFavorite, toggleBlocked } from "@/lib/api/clients-api"
import { useToast } from "@/hooks/use-toast"

const searchFormSchema = z.object({
  query: z.string().optional(),
  status: z.enum(["all", "active", "inactive", "pending"]).default("active"),
})

type SearchFormData = z.infer<typeof searchFormSchema>

const clientActionSchema = z.object({
  clientId: z.string(),
  action: z.enum(["favorite", "block", "status"]),
  value: z.union([z.boolean(), z.string()]),
})

type ClientActionData = z.infer<typeof clientActionSchema>

interface ClientsTableProps {
  initialClients: Client[]
}

export default function ClientsTable({ initialClients }: ClientsTableProps) {
  const [clients, setClients] = useState<Client[]>(initialClients)
  const [isLoading, setIsLoading] = useState(false)
  const [updatingClients, setUpdatingClients] = useState<Set<string>>(new Set())

  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  // Search and filter form
  const searchForm = useForm<SearchFormData>({
    resolver: zodResolver(searchFormSchema),
    defaultValues: {
      query: searchParams?.get("query") || "",
      status: (searchParams?.get("status") as ClientStatus) || "active",
    },
  })

  // Load clients with filters
  useEffect(() => {
    const fetchClients = async () => {
      setIsLoading(true)
      try {
        const formData = searchForm.getValues()
        const fetchedClients = await getClients({
          status: formData.status === "all" ? undefined : formData.status,
          query: formData.query || undefined,
        })
        setClients(fetchedClients)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load clients",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchClients()
  }, [searchParams, toast, searchForm])

  // Handle search form submission
  const onSearchSubmit = async (data: SearchFormData) => {
    const params = new URLSearchParams()

    if (data.query) {
      params.set("query", data.query)
    }

    if (data.status !== "all") {
      params.set("status", data.status)
    }

    router.push(`/client?${params.toString()}`)
  }

  // Handle client actions
  const handleClientAction = async (actionData: ClientActionData) => {
    setUpdatingClients((prev) => new Set(prev).add(actionData.clientId))

    try {
      let updatedClient: Client

      switch (actionData.action) {
        case "favorite":
          updatedClient = await toggleFavorite(actionData.clientId, actionData.value as boolean)
          break
        case "block":
          updatedClient = await toggleBlocked(actionData.clientId, actionData.value as boolean)
          break
        case "status":
          updatedClient = await updateClientStatus(actionData.clientId, actionData.value as ClientStatus)
          break
        default:
          throw new Error("Invalid action")
      }

      // Update local state
      setClients(clients.map((c) => (c.id === actionData.clientId ? updatedClient : c)))

      toast({
        title: "Client updated",
        description: `Client ${actionData.action} has been updated`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to update client ${actionData.action}`,
        variant: "destructive",
      })
    } finally {
      setUpdatingClients((prev) => {
        const newSet = new Set(prev)
        newSet.delete(actionData.clientId)
        return newSet
      })
    }
  }

  // Toggle favorite status
  const handleToggleFavorite = async (clientId: string) => {
    const client = clients.find((c) => c.id === clientId)
    if (!client) return

    await handleClientAction({
      clientId,
      action: "favorite",
      value: !client.isFavorite,
    })
  }

  // Toggle blocked status
  const handleToggleBlocked = async (clientId: string) => {
    const client = clients.find((c) => c.id === clientId)
    if (!client) return

    await handleClientAction({
      clientId,
      action: "block",
      value: !client.isBlocked,
    })
  }

  // View client details
  const viewClientDetails = (clientId: string) => {
    router.push(`/client/${clientId}`)
  }

  // Get status badge
  const getStatusBadge = (status: ClientStatus) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-600 border-yellow-200">
            Pending
          </Badge>
        )
      case "active":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
            Active
          </Badge>
        )
      case "inactive":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
            Inactive
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-4">
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
                        placeholder="Search clients..."
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
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
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
              <TableHead>Client Name</TableHead>
              <TableHead>Case ID</TableHead>
              <TableHead>Contact Info</TableHead>
              <TableHead>Last Contact Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {isLoading ? "Loading clients..." : "No clients found"}
                </TableCell>
              </TableRow>
            ) : (
              clients.map((client, index) => (
                <TableRow
                  key={client.id}
                  className={`cursor-pointer hover:bg-muted/50 ${index % 2 === 0 ? "bg-gray-100" : "bg-white"}`}
                  onClick={() => viewClientDetails(client.id)}
                >
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell className="font-mono">{client.caseId}</TableCell>
                  <TableCell>{client.contactInfo}</TableCell>
                  <TableCell>{formatDate(client.lastContactDate)}</TableCell>
                  <TableCell>{getStatusBadge(client.status)}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleFavorite(client.id)}
                        className={client.isFavorite ? "text-yellow-500" : "text-gray-500"}
                        title={client.isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                        disabled={updatingClients.has(client.id)}
                      >
                        {updatingClients.has(client.id) ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Star size={16} className={client.isFavorite ? "fill-yellow-500" : ""} />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(`/chat?clientId=${client.id}`)}
                        title="Send Message"
                      >
                        <MessageSquare size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleBlocked(client.id)}
                        className={client.isBlocked ? "text-red-500" : "text-gray-500"}
                        title={client.isBlocked ? "Unblock Client" : "Block Client"}
                        disabled={updatingClients.has(client.id)}
                      >
                        {updatingClients.has(client.id) ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Ban size={16} />
                        )}
                      </Button>
                    </div>
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
