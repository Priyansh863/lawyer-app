"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, Edit, Trash2, MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Card, CardContent } from "@/components/ui/card"

interface Document {
  id: string
  name: string
  uploadedBy: string
  uploadDate: string
  summary: string
  status: "approved" | "pending" | "rejected"
}

const mockDocuments: Document[] = [
  {
    id: "1",
    name: "Agreement.pdf",
    uploadedBy: "Client",
    uploadDate: "18/02/2025",
    summary: "Property sale agreement summary",
    status: "approved",
  },
  {
    id: "2",
    name: "ID_Proof.jpg",
    uploadedBy: "Client",
    uploadDate: "18/02/2025",
    summary: "Aadhaar card for verification",
    status: "pending",
  },
  {
    id: "3",
    name: "LegalNotice.docx",
    uploadedBy: "Lawyer",
    uploadDate: "18/02/2025",
    summary: "Notice drafted for rental dispute",
    status: "approved",
  },
  {
    id: "4",
    name: "Agreement.pdf",
    uploadedBy: "Client",
    uploadDate: "18/02/2025",
    summary: "Property sale agreement summary",
    status: "approved",
  },
  {
    id: "5",
    name: "Agreement.pdf",
    uploadedBy: "Lawyer",
    uploadDate: "18/02/2025",
    summary: "Property sale agreement summary",
    status: "approved",
  },
  {
    id: "6",
    name: "Agreement.pdf",
    uploadedBy: "Client",
    uploadDate: "18/02/2025",
    summary: "Property sale agreement summary",
    status: "approved",
  },
]

function getStatusBadge(status: string) {
  switch (status) {
    case "approved":
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Approved</Badge>
    case "pending":
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>
    case "rejected":
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Rejected</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

export function DocumentsTable() {
  const [documents] = useState<Document[]>(mockDocuments)

  return (
    <div className="space-y-4">
      {/* Desktop Table */}
      <div className="hidden md:block">
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document Name</TableHead>
                  <TableHead>Uploaded By</TableHead>
                  <TableHead>Upload Date</TableHead>
                  <TableHead>Summary</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((document) => (
                  <TableRow key={document.id}>
                    <TableCell className="font-medium">{document.name}</TableCell>
                    <TableCell>{document.uploadedBy}</TableCell>
                    <TableCell>{document.uploadDate}</TableCell>
                    <TableCell className="max-w-xs truncate">{document.summary}</TableCell>
                    <TableCell>{getStatusBadge(document.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {documents.map((document) => (
          <Card key={document.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">{document.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Uploaded by {document.uploadedBy} • {document.uploadDate}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <p className="text-sm text-muted-foreground mb-3">{document.summary}</p>

              <div className="flex items-center justify-between">
                {getStatusBadge(document.status)}
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
