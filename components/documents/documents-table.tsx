"use client"

import { useState, useEffect } from "react"
import { useSelector } from "react-redux"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, Trash2, MoreHorizontal, Loader2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { getDocuments, deleteDocument, type Document } from "@/lib/api/documents-api"
import type { RootState } from "@/lib/store"
import { useTranslation } from "@/hooks/useTranslation"

interface DocumentTableProps {
  onDocumentUploaded?: () => void
}

export default function DocumentsTable({ onDocumentUploaded }: DocumentTableProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const { toast } = useToast()
  const { t } = useTranslation()
  const profile = useSelector((state: RootState) => state.auth.user)

  useEffect(() => {
    fetchDocuments()
  }, [onDocumentUploaded])

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      const response = await getDocuments()
      if (response.success && response.documents) {
        setDocuments(response.documents)
      }
    } catch (error: any) {
      toast({
        title: t("common.error"),
        description: error.message || t("pages:documents.fetchError"),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteDocument = async (documentId: string) => {
    try {
      setDeleting(documentId)
      await deleteDocument(documentId)
      setDocuments((prev) => prev.filter((doc) => doc._id !== documentId))
      toast({
        title: t("common.success"),
        description: t("pages:documents.deleteSuccess"),
        variant: "default",
      })
    } catch (error: any) {
      toast({
        title: t("common.error"),
        description: error.message || t("pages:documents.deleteError"),
        variant: "destructive",
      })
    } finally {
      setDeleting(null)
    }
  }

  const getStatusBadge = (status: string) => {
  switch (status.toLowerCase()) {
    case "completed":
    case "approved":
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          {t("pages:documents.completed")}
        </Badge>
      )
    case "pending":
      return (
        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
          {t("pages:documents.processing")}
        </Badge>
      )
    case "rejected":
    case "failed":
      return (
        <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
          {t("pages:documents.failed")}
        </Badge>
      )
    default:
      return (
        <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
          {status}
        </Badge>
      )
  }
}

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">{t("pages:documents.loadingDocuments")}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Desktop Table */}
      <div className="hidden md:block">
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("pages:documents.fileName")}</TableHead>
                  <TableHead>{t("pages:documents.uploadedBy")}</TableHead>
                  <TableHead>{t("pages:documents.uploadDate")}</TableHead>
                  <TableHead>{t("pages:documents.summary")}</TableHead>
                  <TableHead>{t("pages:documents.status")}</TableHead>
                  <TableHead className="text-right">{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((document) => (
                  <TableRow key={document._id}>
                    <TableCell className="font-medium">{document.document_name}</TableCell>
                    <TableCell>{t("common.you")}</TableCell>
                    <TableCell>{formatDate(document.createdAt)}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {document.summary || t("pages:documents.processing")}
                    </TableCell>
                    <TableCell>{getStatusBadge(document.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => window.open(document.link, "_blank")}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {/* Edit and Delete buttons removed from desktop view as they are not present in the original desktop table */}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {documents.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      {t("pages:documents.noDocuments")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {documents.map((document) => (
          <Card key={document._id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  {" "}
                  {/* Added min-w-0 to allow flex item to shrink */}
                  <h3 className="font-semibold text-sm truncate">{document.document_name}</h3>{" "}
                  {/* Added truncate for file name */}
                  <p className="text-xs text-muted-foreground mt-1">
                    Uploaded by You • {formatDate(document.createdAt)}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0" disabled={deleting === document._id}>
                      <span className="sr-only">Open menu</span>
                      {deleting === document._id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <MoreHorizontal className="h-4 w-4" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => window.open(document.link, "_blank")}>
                      <Eye className="mr-2 h-4 w-4" />
                      View PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDeleteDocument(document._id)}
                      disabled={deleting === document._id}
                    >
                      {deleting === document._id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="mr-2 h-4 w-4" />
                      )}
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              {/* Applied truncation and max-width for mobile summary */}
              <p className="text-sm text-muted-foreground mb-3 truncate max-w-[calc(100%-2rem)]">
                {document.summary || t("pages:documents.processing")}
              </p>
              <div className="flex items-center justify-between">
                {getStatusBadge(document.status)}
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => window.open(document.link, "_blank")}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteDocument(document._id)}
                    disabled={deleting === document._id}
                  >
                    {deleting === document._id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {documents.length === 0 && (
          <Card>
            <CardContent className="p-4 text-center text-muted-foreground">
              {t("pages:documents.noDocuments")}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
