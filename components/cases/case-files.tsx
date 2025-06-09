"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { FileUploader } from "@/components/ui/file-uploader"
import { getCaseFiles } from "@/lib/api/files-api"
import { formatBytes, formatDate } from "@/lib/utils"
import { FileText, Download, Trash } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { FileMetadata } from "@/types/file"

interface CaseFilesProps {
  caseId: string
}

export default function CaseFiles({ caseId }: CaseFilesProps) {
  const [files, setFiles] = useState<FileMetadata[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const loadFiles = async () => {
      try {
        setIsLoading(true)
        const caseFiles = await getCaseFiles(caseId)
        setFiles(caseFiles)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load case files",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadFiles()
  }, [caseId, toast])

  const handleFileUploaded = (newFile: FileMetadata) => {
    setFiles((prevFiles) => [...prevFiles, newFile])
  }

  const handleFileDelete = async (fileId: string) => {
    // Implementation would call API to delete file
    setFiles((prevFiles) => prevFiles.filter((file) => file.id !== fileId))
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Case Files</h3>
        <FileUploader
          onFileUploaded={handleFileUploaded}
          metadata={{ caseId }}
          allowedTypes={[".pdf", ".doc", ".docx", ".jpg", ".png"]}
        />
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading files...</div>
      ) : files.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No files uploaded yet</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {files.map((file) => (
            <Card key={file.id} className="p-4 flex items-start gap-3">
              <div className="p-2 bg-gray-100 rounded-md">
                <FileText size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium truncate" title={file.fileName}>
                  {file.fileName}
                </h4>
                <div className="text-sm text-muted-foreground">
                  {formatBytes(file.fileSize)} • {formatDate(file.uploadedAt)}
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" title="Download">
                  <Download size={16} />
                </Button>
                <Button variant="ghost" size="icon" title="Delete" onClick={() => handleFileDelete(file.id)}>
                  <Trash size={16} />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
