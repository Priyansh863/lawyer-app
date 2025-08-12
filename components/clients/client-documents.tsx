"use client";

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { FileUploader } from "@/components/ui/file-uploader"
import { Button } from "@/components/ui/button"
import { getClientFiles, getLawyerFiles } from "@/lib/api/files-api"
import { formatBytes, formatDate } from "@/lib/utils"
import { FileText, Download, Trash } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { FileMetadata } from "@/types/file"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { MoreVertical, Share2, Eye, Users } from "lucide-react"
import { ShareWithLawyerDialog } from "@/components/documents/share-with-lawyer-dialog"
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";

interface ClientDocumentsProps {
  clientId: string;
}

export default function ClientDocuments({ clientId }: ClientDocumentsProps) {
  const [files, setFiles] = useState<FileMetadata[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
const [selectedDocument, setSelectedDocument] = useState<FileMetadata | null>(null)
const user = useSelector((state: RootState) => state.auth.user)



console.log(selectedDocument,"selectedDocumentselectedDocumentselectedDocumentselectedDocument")

  useEffect(() => {
    const loadFiles = async () => {
      try {
        setIsLoading(true)
        const clientFiles = await getClientFiles(clientId)
        setFiles(clientFiles)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load client files",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadFiles()
  }, [clientId, toast])

  const handleFileUploaded = (newFile: FileMetadata) => {
    setFiles((prevFiles) => [...prevFiles, newFile])
  }

  const handleFileDelete = async (fileId: string) => {
    // Implementation would call API to delete file
    setFiles((prevFiles) => prevFiles.filter((file) => file.id !== fileId))
  }

  const handleShareWithLawyer = (file: FileMetadata) => {
    setSelectedDocument(file)
    setShareDialogOpen(true)
  }
  
  const handleViewDocument = (file: FileMetadata) => {
    window.open(file.link, '_blank')
  }
  
  const handleShareUpdate = (updatedDocument: any) => {
    setFiles(prevFiles => 
      prevFiles.map(file => 
        file.id === updatedDocument.id ? { ...file, ...updatedDocument } : file
      )
    )
  }

  console.log(files,"filesfilesfilesfilesfilesfilesfilesfiles")

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Client Documents</h3>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading files...</div>
        ) : files.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No files uploaded for this client</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {files.map((file) => (
            <div key={file.id} className="border rounded-md p-4 flex items-start gap-3">
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
                      Shared with {file.shared_with.length} lawyer{file.shared_with.length > 1 ? 's' : ''}
                    </Badge>
                  </div>
                )}
                {file.privacy === 'private' && (
                  <Badge variant="outline" className="text-xs mt-1">
                    Private
                  </Badge>
                )}
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" title="Download" onClick={() => window.open(file.link)}>
                  <Download size={16} />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" title="More options">
                      <MoreVertical size={16} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleViewDocument(file)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Document
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleShareWithLawyer(file)}>
                      <Share2 className="h-4 w-4 mr-2" />
                      Share with Lawyer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
        )}
      </CardContent>
      {selectedDocument && (
  <ShareWithLawyerDialog
    open={shareDialogOpen}
    onOpenChange={setShareDialogOpen}
    document={{
      id: selectedDocument.id,
      document_name: selectedDocument.document_name || 'Unknown Document',
      privacy: selectedDocument.status === 'private' ? 'private' : 'public',
      shared_with:  selectedDocument.shared_with
    }}
    onShareUpdate={handleShareUpdate}
  />
)}
    </Card>
  );
}
