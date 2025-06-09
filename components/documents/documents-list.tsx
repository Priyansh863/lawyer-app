"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, FileText, Download, Eye, MoreHorizontal, Calendar, User, HardDrive } from "lucide-react"
import { formatDate, formatFileSize } from "@/lib/utils"
import type { Document } from "@/types/document"

interface DocumentsListProps {
  initialDocuments: Document[]
}

export default function DocumentsList({ initialDocuments }: DocumentsListProps) {
  const [documents, setDocuments] = useState<Document[]>(initialDocuments)
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>(initialDocuments)
  const [searchQuery, setSearchQuery] = useState("")

  // Filter documents based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredDocuments(documents)
    } else {
      const filtered = documents.filter(
        (doc) =>
          doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doc.caseTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doc.uploadedBy.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      setFilteredDocuments(filtered)
    }
  }, [searchQuery, documents])

  const getFileIcon = (fileType: string) => {
    return <FileText className="h-4 w-4 text-blue-600" />
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      processed: "default",
      processing: "secondary",
      failed: "destructive",
      pending: "outline",
    }

    return <Badge variant={variants[status] || "outline"}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex w-full max-w-sm items-center space-x-2">
            <div className="flex-1 relative">
              <div className="relative">
                <Input
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-[#F5F5F5] border-gray-200 pl-10"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Document</TableHead>
                  <TableHead className="w-[150px]">Case</TableHead>
                  <TableHead className="w-[120px]">Size</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead className="w-[120px]">Uploaded By</TableHead>
                  <TableHead className="w-[150px]">Upload Date</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">
                        {searchQuery ? "No documents found matching your search." : "No documents uploaded yet."}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDocuments.map((document, index) => (
                    <TableRow key={document.id} className={`hover:bg-gray-50 ${index % 2 === 0 ? "bg-gray-100" : ""}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {getFileIcon(document.type)}
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-gray-900 truncate">{document.name}</div>
                            <div className="text-sm text-gray-500 truncate">{document.type.toUpperCase()}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {document.caseTitle ? (
                          <div className="text-sm text-blue-600 truncate">{document.caseTitle}</div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <HardDrive className="h-3 w-3" />
                          {formatFileSize(document.size)}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(document.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <User className="h-3 w-3" />
                          {document.uploadedBy}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Calendar className="h-3 w-3" />
                          {formatDate(document.uploadedAt, false)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
