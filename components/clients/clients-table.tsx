"use client";
import type { Client, ClientStatus } from "@/types/client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage
} from "@/components/ui/form";
import {
  getClients,
  updateClientStatus,
  toggleFavorite,
  toggleBlocked
} from "@/lib/api/clients-api";
import { useToast } from "@/hooks/use-toast";
import { useSelector } from "react-redux";
import type { RootState } from "@/lib/store";
import { useTranslation } from "@/hooks/useTranslation";
import { Eye } from "lucide-react";

const searchFormSchema = z.object({
  query: z.string().optional(),
  status: z.enum(["all", "active", "inactive", "pending"]).default("active")
});

type SearchFormData = z.infer<typeof searchFormSchema>;

const clientActionSchema = z.object({
  clientId: z.string(),
  action: z.enum(["favorite", "block", "status"]),
  value: z.union([z.boolean(), z.string()])
});

type ClientActionData = z.infer<typeof clientActionSchema>;

interface ClientsTableProps {
  initialClients: Client[];
}

export default function ClientsTable({ initialClients }: ClientsTableProps) {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [filteredClients, setFilteredClients] = useState<Client[]>(initialClients);
  const [isLoading, setIsLoading] = useState(false);
  const [updatingClients, setUpdatingClients] = useState<Set<string>>(new Set());
  const profile = useSelector((state: RootState) => state.auth.user);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { t } = useTranslation();

  // Search and filter form
  const searchForm = useForm<SearchFormData>({
    resolver: zodResolver(searchFormSchema),
    defaultValues: {
      query: searchParams?.get("query") || "",
      status: (searchParams?.get("status") as ClientStatus) || "active"
    }
  });

  // Load clients with filters
  useEffect(() => {
    const fetchClients = async () => {
      setIsLoading(true);
      try {
        const formData = searchForm.getValues();
        const fetchedClients = await getClients({
          status: formData.status === "all" ? undefined : formData.status,
          query: formData.query || undefined
        });
        setClients(fetchedClients);
        setFilteredClients(fetchedClients);
      } catch (error) {
        toast({
          title: t("common.error"),
          description: t("common.error"),
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchClients();
  }, [searchParams, toast, searchForm]);

  // Real-time frontend search
  useEffect(() => {
    const query = searchForm.watch("query") || "";
    const status = searchForm.watch("status");

    let filtered = clients;

    // Filter by search query
    if (query.trim()) {
      filtered = filtered.filter(
        (client) =>
          `${client.first_name || ""} ${client.last_name || ""}`
            .toLowerCase()
            .includes(query.toLowerCase()) ||
          client.email?.toLowerCase().includes(query.toLowerCase()) ||
          client.phone?.toLowerCase().includes(query.toLowerCase()) ||
          client.contactInfo?.toLowerCase().includes(query.toLowerCase())
      );
    }

    // Filter by status
    if (status && status !== "all") {
      filtered = filtered.filter((client) => client.status === status);
    }

    setFilteredClients(filtered);
  }, [searchForm.watch("query"), searchForm.watch("status"), clients]);

  // Handle search submit
  const onSearchSubmit = async (data: SearchFormData) => {
    const params = new URLSearchParams();

    if (data.query) {
      params.set("query", data.query);
    }

    if (data.status !== "all") {
      params.set("status", data.status);
    }

    router.push(`/client?${params.toString()}`);
  };

  // Handle client actions
  const handleClientAction = async (actionData: ClientActionData) => {
    setUpdatingClients((prev) => new Set(prev).add(actionData.clientId));

    try {
      let updatedClient: Client;

      switch (actionData.action) {
        case "favorite":
          updatedClient = await toggleFavorite(
            actionData.clientId,
            actionData.value as boolean
          );
          break;
        case "block":
          updatedClient = await toggleBlocked(
            actionData.clientId,
            actionData.value as boolean
          );
          break;
        case "status":
          updatedClient = await updateClientStatus(
            actionData.clientId,
            actionData.value as ClientStatus
          );
          break;
        default:
          throw new Error("Invalid action");
      }

      // Update local state
      setClients(
        clients.map((c) => (c.id === actionData.clientId ? updatedClient : c))
      );

      toast({
        title: t("common.success"),
        description: t("common.success")
      });
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("common.error"),
        variant: "destructive"
      });
    } finally {
      setUpdatingClients((prev) => {
        const newSet = new Set(prev);
        newSet.delete(actionData.clientId);
        return newSet;
      });
    }
  };

  // View client details
  const viewClientDetails = (client: Client) => {
    const clientData = encodeURIComponent(JSON.stringify(client));
    router.push(`/client/${client.id}?data=${clientData}`);
  };

  // Get status badge
  const getStatusBadge = (status: ClientStatus) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-600 border-yellow-200">
            {t("pages:cases.pending")}
          </Badge>
        );
      case "active":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
            {t("pages:cases.active")}
          </Badge>
        );
      case "inactive":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
            {t("pages:cases.closed")}
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

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
                    <option value="all">{t("common.allStatuses") || "All Status"}</option>
                    <option value="active">{t("common.active") || "Active"}</option>
                    <option value="inactive">{t("common.inactive") || "Inactive"}</option>
                    <option value="pending">{t("common.pending") || "Pending"}</option>
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
              <TableHead>{t("common.name") || "Name"}</TableHead>
              <TableHead>{t("common.email") || "Email"}</TableHead>
              <TableHead>{t("common.phone") || "Phone"}</TableHead>
              <TableHead>{t("common.address") || "Address"}</TableHead>
              <TableHead>{t("common.activeCases") || "Active Cases"}</TableHead>
              <TableHead>{t("common.lastContact") || "Last Contact"}</TableHead>
              <TableHead>{t("common.actions") || "Actions"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-8 text-muted-foreground"
                >
                  {isLoading
                    ? t("common.loading")
                    : t("common.noClientsFound") || "No clients found"}
                </TableCell>
              </TableRow>
            ) : (
              filteredClients.map((client, index) => (
                <TableRow
                  key={client.id}
                  className={`hover:bg-muted/50 cursor-pointer ${
                    index % 2 === 0 ? "bg-gray-50" : "bg-white"
                  }`}
                  onClick={() => viewClientDetails(client)}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <span>{client.first_name} {client.last_name}</span>
                      {client.isFavorite && <span className="text-yellow-500">⭐</span>}
                    </div>
                  </TableCell>
                  <TableCell>{client.email || "N/A"}</TableCell>
                  <TableCell>{client.phone || "N/A"}</TableCell>
                  <TableCell
                    className="max-w-[150px] truncate"
                    title={client.address}
                  >
                    {client.address || "N/A"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="bg-blue-50 text-blue-600 border-blue-200"
                    >
                      {client.activeCases || 0}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {client.lastContactDate
                      ? new Date(client.lastContactDate).toLocaleDateString()
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    {/* Eye icon instead of "View" text */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        viewClientDetails(client);
                      }}
                      className="p-1 text-blue-600 hover:text-blue-800"
                      title={t("common.viewDetails") || "View details"}
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
