"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getClientDocuments, deleteDocument, updateDocumentStatus, type Document } from "@/lib/api/documents-api";
import { formatDate } from "@/lib/utils";
import { FileText, Download, Trash, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "@/hooks/useTranslation";

interface ClientDocumentsProps {
  clientId: string;
}

export default function ClientDocuments({ clientId }: ClientDocumentsProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingDocuments, setUpdatingDocuments] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    let isMounted = true;

    const loadDocuments = async () => {
      try {
        setIsLoading(true);
        const clientDocuments = await getClientDocuments(clientId);
        if (isMounted) {
          setDocuments(clientDocuments);
        }
      } catch (error) {
        toast({
          title: t("pages:clientDocuments.error"),
          description: t("pages:clientDocuments.failedToLoad"),
          variant: "destructive",
        });
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadDocuments();

    return () => {
      isMounted = false;
    };
  }, [clientId]); // ✅ Only refetch when clientId changes

  const handleDocumentDelete = async (documentId: string) => {
    try {
      setUpdatingDocuments((prev) => new Set(prev).add(documentId));
      await deleteDocument(documentId);
      setDocuments((prevDocs) => prevDocs.filter((doc) => doc._id !== documentId));
      toast({
        title: t("pages:clientDocuments.success"),
        description: t("pages:clientDocuments.docDeleted"),
      });
    } catch (error) {
      toast({
        title: t("pages:clientDocuments.error"),
        description: t("pages:clientDocuments.docDeleteFailed"),
        variant: "destructive",
      });
    } finally {
      setUpdatingDocuments((prev) => {
        const newSet = new Set(prev);
        newSet.delete(documentId);
        return newSet;
      });
    }
  };

  const handleStatusUpdate = async (documentId: string, status: "Pending" | "Approved" | "Rejected") => {
    try {
      setUpdatingDocuments((prev) => new Set(prev).add(documentId));
      const updatedDocument = await updateDocumentStatus(documentId, status);
      setDocuments((prevDocs) =>
        prevDocs.map((doc) => (doc._id === documentId ? updatedDocument : doc))
      );
      toast({
        title: t("pages:clientDocuments.success"),
        description: t("pages:clientDocuments.docStatusUpdated"),
      });
    } catch (error) {
      toast({
        title: t("pages:clientDocuments.error"),
        description: t("pages:clientDocuments.docStatusUpdateFailed"),
        variant: "destructive",
      });
    } finally {
      setUpdatingDocuments((prev) => {
        const newSet = new Set(prev);
        newSet.delete(documentId);
        return newSet;
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusKey = status.toLowerCase() as "pending" | "approved" | "rejected";
    const badgeMap: Record<string, string> = {
      pending: "bg-yellow-50 text-yellow-600 border-yellow-200",
      approved: "bg-green-50 text-green-600 border-green-200",
      rejected: "bg-red-50 text-red-600 border-red-200",
    };
    return (
      <Badge variant="outline" className={badgeMap[statusKey] || ""}>
        {t(`pages:clientDocuments.status.${statusKey}`)}
      </Badge>
    );
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">{t("pages:clientDocuments.title")}</h3>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            {t("pages:clientDocuments.loading")}
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {t("pages:clientDocuments.notFound")}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("pages:clientDocuments.docName")}</TableHead>
                <TableHead>{t("pages:clientDocuments.statuss")}</TableHead>
                <TableHead>{t("pages:clientDocuments.uploaded")}</TableHead>
                <TableHead>{t("pages:clientDocuments.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((document) => (
                <TableRow key={document._id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-blue-500" />
                      <span className="font-medium">{document.document_name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(document.status)}</TableCell>
                  <TableCell>{formatDate(document.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" title={t("pages:clientDocuments.view")}>
                            <Eye size={16} />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>{t("pages:clientDocuments.details")}</DialogTitle>
                            <DialogDescription>
                              {document.document_name}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <strong>{t("pages:clientDocuments.statuss")}:</strong>{" "}
                              {getStatusBadge(document.status)}
                            </div>
                            <div>
                              <strong>{t("pages:clientDocuments.uploaded")}:</strong>{" "}
                              {formatDate(document.createdAt)}
                            </div>
                            {document.summary && (
                              <div>
                                <strong>{t("pages:clientDocuments.summary")}:</strong>
                                <p className="mt-1 text-sm text-muted-foreground">
                                  {document.summary}
                                </p>
                              </div>
                            )}
                            <div>
                              <strong>{t("pages:clientDocuments.updateStatus")}:</strong>
                              <Select
                                value={document.status}
                                onValueChange={(value) =>
                                  handleStatusUpdate(document._id, value as "Pending" | "Approved" | "Rejected")
                                }
                                disabled={updatingDocuments.has(document._id)}
                              >
                                <SelectTrigger className="mt-2">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Pending">
                                    {t("pages:clientDocuments.status.pending")}
                                  </SelectItem>
                                  <SelectItem value="Approved">
                                    {t("pages:clientDocuments.status.approved")}
                                  </SelectItem>
                                  <SelectItem value="Rejected">
                                    {t("pages:clientDocuments.status.rejected")}
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Button
                        variant="ghost"
                        size="icon"
                        title={t("pages:clientDocuments.download")}
                        onClick={() => window.open(document.link, "_blank")}
                      >
                        <Download size={16} />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        title={t("pages:clientDocuments.delete")}
                        onClick={() => handleDocumentDelete(document._id)}
                        disabled={updatingDocuments.has(document._id)}
                      >
                        <Trash size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
