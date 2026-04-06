"use client";
import type { Client, ClientStatus } from "@/types/client";

import { useState, useEffect, useMemo } from "react";
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
import { Eye, Search } from "lucide-react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import OnboardClientForm from "./onboard-client-form";
import ClientDetailsDialog from "./client-details-dialog";

const searchFormSchema = z.object({
  query: z.string().optional(),
  status: z.enum(["all", "active", "inactive", "pending"]).default("all")
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
  onClientCreated?: () => void;
}

export default function ClientsTable({ initialClients, onClientCreated }: ClientsTableProps) {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [isLoading, setIsLoading] = useState(false);
  const [updatingClients, setUpdatingClients] = useState<Set<string>>(new Set());
  const [clientDetailsDialog, setClientDetailsDialog] = useState<{
    open: boolean;
    client: Client | null;
  }>({ open: false, client: null });
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
      status: (searchParams?.get("status") as ClientStatus) || "all"
    }
  });

  const searchQuery = searchForm.watch("query") || "";
  const statusWatch = searchForm.watch("status");

  const filteredClients = useMemo(() => {
    let filtered = clients;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (client) =>
          `${client.first_name || ""} ${client.last_name || ""}`
            .toLowerCase()
            .includes(q) ||
          client.email?.toLowerCase().includes(q) ||
          client.phone?.toLowerCase().includes(q) ||
          client.contactInfo?.toLowerCase().includes(q)
      );
    }

    if (statusWatch && statusWatch !== "all") {
      filtered = filtered.filter((client) => client.status === statusWatch);
    }

    return filtered;
  }, [clients, searchQuery, statusWatch]);

  // Load clients with filters (high limit so new onboarded clients are not cut off the first page)
  useEffect(() => {
    const fetchClients = async () => {
      setIsLoading(true);
      try {
        const formData = searchForm.getValues();
        const fetchedClients = await getClients({
          status: formData.status === "all" ? undefined : formData.status,
          query: formData.query || undefined,
          limit: 500
        });
        setClients(fetchedClients);
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
  }, [searchParams, searchForm]);

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

  // View client details
  const viewClientDetails = (client: Client) => {
    setClientDetailsDialog({ open: true, client });
  };

  // Get status dot/text
  const getStatusDisplay = (status: ClientStatus) => {
    switch (status) {
      case "pending":
        return (
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-amber-500" />
            <span className="text-sm font-medium text-[#0F172A]">{t('pages:clientsTable.pending')}</span>
          </div>
        );
      case "active":
        return (
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-sm font-medium text-[#0F172A]">{t('pages:clientsTable.active')}</span>
          </div>
        );
      case "inactive":
        return (
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-red-500" />
            <span className="text-sm font-medium text-[#0F172A]">{t('pages:clientsTable.inactive')}</span>
          </div>
        );
      default:
        return <span className="text-[#0F172A] font-medium">{status}</span>;
    }
  };

  // Simple date format Oct 31, 2025 - 18:53 PM
  const formatLastContacted = (dateStr: string | undefined) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hoursStr = hours.toString().padStart(2, '0');

    return `${month} ${day}, ${year} - ${hoursStr}:${minutes} ${ampm}`;
  };

  return (
    <div className="space-y-6">
      <Form {...searchForm}>
        <form
          onSubmit={searchForm.handleSubmit(onSearchSubmit)}
          className="flex flex-col sm:flex-row gap-4 justify-end items-center"
        >
          <div className="flex flex-1 sm:max-w-xs items-center">
            <FormField
              control={searchForm.control}
              name="query"
              render={({ field }) => (
                <FormItem className="flex-1 text-[#0F172A]">
                  <FormControl>
                    <div className="relative">
                      <Input
                        placeholder={t('pages:common.search')}
                        {...field}
                        value={field.value || ""}
                        className="bg-white border-gray-300 h-10 rounded-md focus-visible:ring-0 text-[#0F172A] placeholder:text-slate-900 font-medium"
                      />
                    </div>
                  </FormControl>
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
                    className="bg-white border border-gray-300 rounded-md px-4 h-10 min-w-[120px] text-sm font-medium focus:outline-none text-[#0F172A]"
                  >
                    <option value="all">{t('pages:clientsTable.allStatus')}</option>
                    <option value="active">{t('pages:clientsTable.active')}</option>
                    <option value="inactive">{t('pages:clientsTable.inactive')}</option>
                    <option value="pending">{t('pages:clientsTable.pending')}</option>
                  </select>
                </FormControl>
              </FormItem>
            )}
          />

          <div className="flex flex-1"></div>
        </form>
      </Form>

      <div className="rounded-lg border border-slate-300 overflow-hidden bg-white shadow-sm">
        <Table className="w-full">
          <TableHeader className="bg-[#f8f9fa]">
            <TableRow className="hover:bg-transparent border-b border-slate-300">
              <TableHead className="py-2 px-4 font-bold text-[#0F172A] text-[13px]">{t('pages:clientsTable.name')}</TableHead>
              <TableHead className="py-2 px-4 font-bold text-[#0F172A] text-[13px]">{t('pages:clientsTable.email')}</TableHead>
              <TableHead className="py-2 px-4 font-bold text-[#0F172A] text-[13px]">{t('pages:clientsTable.phoneNumber')}</TableHead>
              <TableHead className="py-2 px-4 font-bold text-[#0F172A] text-[13px]">{t('pages:clientsTable.lastContacted')}</TableHead>
              <TableHead className="py-2 px-4 font-bold text-[#0F172A] text-[13px]">{t('pages:clientsTable.status')}</TableHead>
              <TableHead className="py-2 px-4 font-bold text-[#0F172A] text-[13px] text-center">{t('pages:clientsTable.action')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow
                  key={index}
                  className="border-b border-slate-300 last:border-0"
                >
                  <TableCell className="py-2 px-4"><Skeleton width={120} /></TableCell>
                  <TableCell className="py-2 px-4"><Skeleton width={150} /></TableCell>
                  <TableCell className="py-2 px-4"><Skeleton width={100} /></TableCell>
                  <TableCell className="py-2 px-4"><Skeleton width={140} /></TableCell>
                  <TableCell className="py-2 px-4"><Skeleton width={80} /></TableCell>
                  <TableCell className="py-2 px-4 flex justify-center"><Skeleton circle width={24} height={24} /></TableCell>
                </TableRow>
              ))
            ) : filteredClients.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-12 text-[#0F172A]"
                >
                  {t('pages:clientsTable.noClientsFound')}
                </TableCell>
              </TableRow>
            ) : (
              filteredClients.map((client, index) => (
                <TableRow
                  key={client.id}
                  className="hover:bg-slate-50/50 cursor-pointer border-b border-slate-300 transition-colors bg-white last:border-b-0 text-[#0F172A]"
                  onClick={() => viewClientDetails(client)}
                >
                  <TableCell className="py-2 px-4 text-[13px] font-medium">
                    {client.first_name || client.last_name ? `${client.first_name || ''} ${client.last_name || ''}`.trim() : "N/A"}
                  </TableCell>
                  <TableCell className="py-2 px-4 text-[13px] font-medium">{client.email || "N/A"}</TableCell>
                  <TableCell className="py-2 px-4 text-[13px] font-medium">{client.phone || "N/A"}</TableCell>
                  <TableCell className="py-2 px-4 text-[13px] font-medium">
                    {formatLastContacted(client.lastContactDate)}
                  </TableCell>
                  <TableCell className="py-2 px-4">
                    {getStatusDisplay(client.status)}
                  </TableCell>
                  <TableCell className="py-2 px-4">
                    <div className="flex justify-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          viewClientDetails(client);
                        }}
                        className="p-1 text-[#0F172A] hover:text-black transition-colors"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ClientDetailsDialog
        clientData={clientDetailsDialog.client}
        open={clientDetailsDialog.open}
        onOpenChange={(open) => setClientDetailsDialog({ open, client: open ? clientDetailsDialog.client : null })}
      />
    </div>
  );
}
