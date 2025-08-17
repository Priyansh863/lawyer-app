"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Download, Eye, Share2, Trash2, MoreVertical } from "lucide-react"
import { getCaseDocuments, downloadDocumentSummary, deleteDocument } from "@/lib/api/documents-api"
import { formatDate, formatFileSize } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/hooks/useTranslation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface CaseDocument {
  _id: string
  document_name: string
  status: string
  uploaded_by: {
    _id: string
    first_name: string
    last_name: string
    email: string
    account_type: string
  }
  link: string
  file_type: string
  document_type: string
  privacy: string
  file_size: number
  summary?: string
  created_at: string
  updated_at: string
  shared_with: any[]
  case_id: string
}

interface CaseDocumentsProps {
  caseId: string
  caseTitle: string
}

export default function CaseDocuments({ caseId, caseTitle }: CaseDocumentsProps) {
  const [documents, setDocuments] = useState<CaseDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [downloadingSummaryId, setDownloadingSummaryId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { toast } = useToast()
  const { t } = useTranslation()

  useEffect(() => {
    fetchCaseDocuments()
  }, [caseId])

  const fetchCaseDocuments = async () => {
    try {
      setLoading(true)
      const response = await getCaseDocuments(caseId)
      
      if (response.success && response.documents) {
        setDocuments(response.documents as unknown as CaseDocument[])
      } else {
        console.error('Failed to fetch case documents:', response.message)
        setDocuments([])
      }
    } catch (error) {
      console.error('Error fetching case documents:', error)
      toast({
        title: "Error",
        description: "Failed to load case documents",
        variant: "destructive"
      })
      setDocuments([])
    } finally {
      setLoading(false)
    }
  }

  const handleViewDocument = (doc: CaseDocument) => {
    if (doc.link) {
      window.open(doc.link, '_blank')
    } else {
      toast({
        title: "Error",
        description: "Document link not available",
        variant: "destructive"
      })
    }
  }

  const handleDownloadSummary = async (doc: CaseDocument) => {
    if (!doc.summary) {
      toast({
        title: "No Summary",
        description: "This document doesn't have a summary yet",
        variant: "destructive"
      })
      return
    }

    try {
      setDownloadingSummaryId(doc._id)
      await downloadDocumentSummary(doc._id, doc.document_name, doc.file_size.toString())
      toast({
        title: "Success",
        description: "Document summary downloaded successfully"
      })
    } catch (error) {
      console.error('Error downloading summary:', error)
      toast({
        title: "Error",
        description: "Failed to download document summary",
        variant: "destructive"
      })
    } finally {
      setDownloadingSummaryId(null)
    }
  }

  const handleDeleteDocument = async (doc: CaseDocument) => {
    if (!confirm(`Are you sure you want to delete "${doc.document_name}"?`)) {
      return
    }

    try {
      setDeletingId(doc._id)
      await deleteDocument(doc._id)
      
      // Remove document from local state
      setDocuments(documents.filter(d => d._id !== doc._id))
      
      toast({
        title: "Success",
        description: "Document deleted successfully"
      })
    } catch (error) {
      console.error('Error deleting document:', error)
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive"
      })
    } finally {
      setDeletingId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase()
    let colorClasses = ""
    
    switch (statusLower) {
      case 'completed':
        colorClasses = "bg-green-50 text-green-600 border-green-200"
        break
      case 'pending':
        colorClasses = "bg-yellow-50 text-yellow-600 border-yellow-200"
        break
      case 'failed':
        colorClasses = "bg-red-50 text-red-600 border-red-200"
        break
      default:
        colorClasses = "bg-gray-50 text-gray-600 border-gray-200"
    }

    return (
      <Badge variant="outline" className={colorClasses}>
        {status}
      </Badge>
    )
  }

  const getPrivacyBadge = (privacy: string) => {
    const privacyLower = privacy.toLowerCase()
    let colorClasses = ""
    
    switch (privacyLower) {
      case 'public':
        colorClasses = "bg-blue-50 text-blue-600 border-blue-200"
        break
      case 'private':
        colorClasses = "bg-purple-50 text-purple-600 border-purple-200"
        break
      case 'fully_private':
        colorClasses = "bg-gray-50 text-gray-600 border-gray-200"
        break
      default:
        colorClasses = "bg-gray-50 text-gray-600 border-gray-200"
    }

    return (
      <Badge variant="outline" className={colorClasses}>
        {privacy.replace('_', ' ')}
      </Badge>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Case Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">Loading documents...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Case Documents
          <Badge variant="secondary" className="ml-auto">
            {documents.length} {documents.length === 1 ? 'document' : 'documents'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
            <p className="text-gray-500">
              No documents have been uploaded for this case yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Uploaded By</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Privacy</TableHead>
                  <TableHead>Size</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc._id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-red-500" />
                        <div>
                          <p className="font-medium truncate max-w-[200px]" title={doc.document_name}>
                            {doc.document_name}
                          </p>
                          <p className="text-xs text-gray-500">{doc.file_type.toUpperCase()}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {doc.uploaded_by.first_name} {doc.uploaded_by.last_name}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">
                          {doc.uploaded_by.account_type}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(doc.status)}</TableCell>
                    <TableCell>{getPrivacyBadge(doc.privacy)}</TableCell>
                    <TableCell>{formatFileSize(doc.file_size)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
