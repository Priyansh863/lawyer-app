"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getClientFiles, getLawyerFiles } from "@/lib/api/files-api";
import { downloadDocument, getDocumentViewUrl } from "@/lib/api/documents-api";
import { FileText, Download, MoreVertical, Share2, Eye, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { FileMetadata } from "@/types/file";
import { useTranslation } from "@/hooks/useTranslation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { casesApi } from "@/lib/api/cases-api";

interface ClientDocumentsProps {
  clientId: string;
}

export default function ClientDocuments({ clientId }: ClientDocumentsProps) {
  const { t } = useTranslation();
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<FileMetadata | null>(null);
  const user = useSelector((state: RootState) => state.auth.user);
  const isLawyer = user?.account_type === "lawyer";

  useEffect(() => {
    const refreshIntervalMs = 10_000; // Keep client status view in sync after uploads
    let isCancelled = false;
    let inFlight = false;

    const loadFiles = async (opts?: { silent?: boolean }) => {
      if (inFlight) return; // prevent overlapping fetches
      inFlight = true;

      try {
        if (!opts?.silent) setIsLoading(true);

        console.log("Fetching client files for clientId:", clientId);
        const [clientFiles, casesResp] = await Promise.all([
          isLawyer ? getLawyerFiles(clientId) : getClientFiles(clientId),
          isLawyer ? casesApi.getCases({ status: "all", page: 1, limit: 200 }) : Promise.resolve(null),
        ])
        if (isCancelled) return;

        console.log("✅ Files loaded:", clientFiles);
        // Normalize backend payload to what the UI expects.
        // Backend responses may use `_id`/`created_at` instead of `id`/`createdAt`.
        const normalized = clientFiles.map((f: any) => {
          const id = f.id ?? f._id ?? f.document_id
          const createdAt = f.createdAt ?? f.created_at ?? f.created_at
          const document_name = f.document_name ?? f.name ?? f.documentTitle
          const caseId = f.caseId ?? f.case_id ?? f.case?.id ?? f.case?._id ?? f.caseID

          return {
            ...f,
            id,
            createdAt,
            document_name,
            caseId,
            // Ensure privacy comparison is consistent.
            privacy: typeof f.privacy === "string" ? f.privacy.toLowerCase() : f.privacy,
            // UI expects an array for shared_with badge.
            shared_with: Array.isArray(f.shared_with) ? f.shared_with : [],
          }
        })

        if (isLawyer && casesResp?.cases) {
          const allowedCaseIds = new Set(
            casesResp.cases
              .filter((c: any) => {
                const cClient = c.client_id
                const cClientId = typeof cClient === "string" ? cClient : (cClient?._id ?? cClient?.id)
                return String(cClientId ?? "") === String(clientId)
              })
              .map((c: any) => String(c._id ?? c.id ?? ""))
              .filter(Boolean)
          )

          // Privacy-safe default: if a doc doesn't declare caseId, don't show it to lawyer.
          const restricted = normalized.filter((f: any) => {
            const cid = f.caseId ?? (f as any).case_id
            if (!cid) return false
            return allowedCaseIds.has(String(cid))
          })
          setFiles(restricted as FileMetadata[])
        } else {
          setFiles(normalized as FileMetadata[]);
        }
      } catch (error) {
        console.error("❌ Failed to load files", error);
        if (!opts?.silent) {
          toast({
            title: t("error"),
            description: t("pages:prdoc.failedToLoadClientFiles"),
            variant: "destructive",
          });
        }
      } finally {
        inFlight = false;
        if (!isCancelled && !opts?.silent) setIsLoading(false);
      }
    };

    // Initial load
    loadFiles();

    // Poll for changes so newly uploaded documents show up automatically
    const intervalId = window.setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      loadFiles({ silent: true });
    }, refreshIntervalMs);

    return () => {
      isCancelled = true;
      window.clearInterval(intervalId);
    };
  }, [clientId, isLawyer]); // Re-run when switching clients or role

  const handleFileUploaded = (newFile: FileMetadata) => {
    setFiles((prevFiles) => [...prevFiles, newFile]);
  };

  const handleFileDelete = async (fileId: string) => {
    // TODO: Call API to delete file
    setFiles((prevFiles) => prevFiles.filter((file) => file.id !== fileId));
  };

  const handleShareWithLawyer = (file: FileMetadata) => {
    setSelectedDocument(file);
    setShareDialogOpen(true);
  };

  const handleViewDocument = async (file: FileMetadata) => {
    const rawLink = (file.link || '').trim()
    const docId = file.id ?? (file as any)._id
    if (!docId && !rawLink) {
        toast({
          title: t("error"),
          description: "Document id missing",
          variant: "destructive"
        })
        return
    }

    try {
        const url = await getDocumentViewUrl(docId, rawLink)
        window.open(url, "_blank", "noopener,noreferrer")
    } catch (e) {
        console.error("Failed to open document via API:", e)
        if (rawLink && rawLink.trim() && rawLink.trim() !== '#') {
            const openUrl = rawLink.startsWith('http') || rawLink.startsWith('/') || rawLink.startsWith('data:') || rawLink.startsWith('blob:')
                ? rawLink
                : `https://${rawLink}`
            window.open(openUrl, "_blank", "noopener,noreferrer")
        } else {
            toast({
              title: t("error"),
              description: "Unable to open document",
              variant: "destructive"
            })
        }
    }
  };

  const handleDownloadDocument = async (file: FileMetadata) => {
    const rawLink = (file.link || '').trim()
    const docId = (file.id ?? (file as any)._id) || ""
    try {
        await downloadDocument(docId, file.document_name || "document", rawLink, (file as any).file_base64)
        toast({ title: t("download"), description: "Download started" })
    } catch (error) {
        toast({ variant: 'destructive', title: t("error"), description: "Failed to download document" })
    }
  };

  const handleShareUpdate = (updatedDocument: any) => {
    setFiles((prevFiles) =>
      prevFiles.map((file) =>
        file.id === updatedDocument.id ? { ...file, ...updatedDocument } : file
      )
    );
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">{t("pages:prdoc.documents")}</h3>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            {t("pages:prdoc.loadingFiles")}
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {t("pages:prdoc.noFilesUploaded")}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {files.map((file) => (
              <div
                key={file.id ?? (file as any)._id ?? file.document_name}
                className="border rounded-md p-4 flex items-start gap-3"
              >
                <div className="p-2 bg-gray-100 rounded-md">
                  <FileText size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate" title={file.document_name}>
                    {file.document_name}
                  </h4>
                  <div className="text-sm text-muted-foreground">
                    {file.createdAt}
                  </div>
                  {file.shared_with && file.shared_with.length > 0 && (
                    <div className="mt-2">
                      <Badge variant="secondary" className="text-xs">
                        <Users className="h-3 w-3 mr-1" />
                        {t("pages:prdoc.sharedWith", {
                          count: file.shared_with.length,
                          lawyers: file.shared_with.length,
                        })}
                      </Badge>
                    </div>
                  )}
                  {file.privacy === "private" && (
                    <Badge variant="outline" className="text-xs mt-1">
                      {t("pages:prdoc.private")}
                    </Badge>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    title={t("download")}
                    onClick={() => handleDownloadDocument(file)}
                  >
                    <Download size={16} />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleViewDocument(file)}>
                        <Eye className="h-4 w-4 mr-2" />
                        {t("pages:prdoc.viewDocument")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleShareWithLawyer(file)}
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        {t("pages:prdoc.shareDocument")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
