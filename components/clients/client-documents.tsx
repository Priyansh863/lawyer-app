"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getClientDocuments, deleteDocument, updateDocumentStatus, type Document } from "@/lib/api/documents-api"
import { formatDate } from "@/lib/utils"
import { FileText, Download, Trash, Eye, Upload } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface ClientDocumentsProps {
  clientId: string
}

export default function ClientDocuments({ clientId }: ClientDocumentsProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [updatingDocuments, setUpdatingDocuments] = useState<Set<string>>(new Set())
  const { toast } = useToast()

  useEffect(() => {
    const loadDocuments = async () => {
      try {
        setIsLoading(true)
        const clientDocuments = await getClientDocuments(clientId)
        setDocuments(clientDocuments)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load client documents",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadDocuments()
  }, [clientId, toast])

  const handleDocumentDelete = async (documentId: string) => {
    try {
      setUpdatingDocuments((prev) => new Set(prev).add(documentId))
      await deleteDocument(documentId)
      setDocuments((prevDocs) => prevDocs.filter((doc) => doc._id !== documentId))
      toast({
        title: "Success",
        description: "Document deleted successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive",
      })
    } finally {
      setUpdatingDocuments((prev) => {
        const newSet = new Set(prev)
        newSet.delete(documentId)
        return newSet
      })
    }
  }

  const handleStatusUpdate = async (documentId: string, status: 'Pending' | 'Approved' | 'Rejected') => {
    try {
      setUpdatingDocuments((prev) => new Set(prev).add(documentId))
      const updatedDocument = await updateDocumentStatus(documentId, status)
      setDocuments((prevDocs) => 
        prevDocs.map((doc) => doc._id === documentId ? updatedDocument : doc)
      )
      toast({
        title: "Success",
        description: "Document status updated successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update document status",
        variant: "destructive",
      })
    } finally {
      setUpdatingDocuments((prev) => {
        const newSet = new Set(prev)
        newSet.delete(documentId)
        return newSet
      })
    }
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pending":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-600 border-yellow-200">
            Pending
          </Badge>
        )
      case "Approved":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
            Approved
          </Badge>
        )
      case "Rejected":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
            Rejected
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Client Documents</h3>
          {/* <Button size="sm">
            <Upload size={16} className="mr-2" />
            Upload Document
          </Button> */}
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading documents...</div>
        ) : documents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No documents found for this client</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Uploaded Date</TableHead>
                <TableHead>Actions</TableHead>
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
                          <Button variant="ghost" size="icon" title="View Document">
                            <Eye size={16} />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Document Details</DialogTitle>
                            <DialogDescription>
                              {document.document_name}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <strong>Status:</strong> {getStatusBadge(document.status)}
                            </div>
                            <div>
                              <strong>Uploaded:</strong> {formatDate(document.createdAt)}
                            </div>
                            {document.summary && (
                              <div>
                                <strong>Summary:</strong>
                                <p className="mt-1 text-sm text-muted-foreground">{document.summary}</p>
                              </div>
                            )}
                            <div>
                              <strong>Update Status:</strong>
                              <Select
                                value={document.status}
                                onValueChange={(value) => 
                                  handleStatusUpdate(document._id, value as 'Pending' | 'Approved' | 'Rejected')
                                }
                                disabled={updatingDocuments.has(document._id)}
                              >
                                <SelectTrigger className="mt-2">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Pending">Pending</SelectItem>
                                  <SelectItem value="Approved">Approved</SelectItem>
                                  <SelectItem value="Rejected">Rejected</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Download"
                        onClick={() => window.open(document.link, '_blank')}
                      >
                        <Download size={16} />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Delete"
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
  )
}
