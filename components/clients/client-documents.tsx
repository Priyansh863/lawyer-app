"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getClientFiles } from "@/lib/api/files-api"; // only client files used here
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

  useEffect(() => {
    const loadFiles = async () => {
      try {
        setIsLoading(true);
        console.log("Fetching client files for clientId:", clientId);
        const clientFiles = await getClientFiles(clientId);

        console.log("✅ Files loaded:", clientFiles);
        setFiles(clientFiles);
      } catch (error) {
        console.error("❌ Failed to load files", error);
        toast({
          title: t("error"),
          description: t("pages:prdoc.failedToLoadClientFiles"),
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadFiles();
  }, [clientId]); // ✅ only re-run when clientId changes

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

  const handleViewDocument = (file: FileMetadata) => {
    window.open(file.link, "_blank");
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
                key={file.id}
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
                    onClick={() => window.open(file.link)}
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
