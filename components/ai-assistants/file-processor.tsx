"use client"

import { useState, useRef } from "react"
import { useSelector } from "react-redux"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { 
  FileText, 
  Upload, 
  Loader2, 
  Image, 
  Video, 
  File,
  CheckCircle,
  AlertCircle,
  X
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { uploadUniversalFile } from "@/lib/helpers/fileupload"
import { RootState } from "@/lib/store"

// Enhanced API function for multi-file upload
const uploadDocumentEnhanced = async (data: {
  userId: string
  fileUrl: string
  fileName: string
  fileType?: string
}) => {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL
  const token = localStorage.getItem('authToken')
  
  const response = await fetch(`${API_BASE_URL}/document/upload-enhanced`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  })
  
  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`)
  }
  
  return response.json()
}

interface ProcessedFile {
  _id: string
  document_name: string
  status: string
  summary?: string
  file_type: string
  link: string
  created_at: string
}

export default function FileProcessor() {
  const [activeTab, setActiveTab] = useState("upload")
  const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  
  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const { toast } = useToast()
  const profile = useSelector((state: RootState) => state.auth.user)

  // Supported file types
  const supportedTypes = {
    pdf: {
      extensions: ['.pdf'],
      icon: FileText,
      color: 'bg-red-100 text-red-800',
      label: 'PDF Document'
    },
    docx: {
      extensions: ['.docx', '.doc'],
      icon: FileText,
      color: 'bg-blue-100 text-blue-800',
      label: 'Word Document'
    },
    text: {
      extensions: ['.txt', '.text'],
      icon: File,
      color: 'bg-green-100 text-green-800',
      label: 'Text File'
    },
    image: {
      extensions: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.tiff', '.tif'],
      icon: Image,
      color: 'bg-orange-100 text-orange-800',
      label: 'Image'
    },
    video: {
      extensions: ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv', '.m4v', '.3gp', '.ogv'],
      icon: Video,
      color: 'bg-purple-100 text-purple-800',
      label: 'Video'
    }
  }

  const getFileType = (fileName: string) => {
    const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'))
    
    for (const [type, config] of Object.entries(supportedTypes)) {
      if (config.extensions.includes(extension)) {
        return { type, ...config }
      }
    }
    
    return null
  }

  const isFileSupported = (file: File) => {
    return getFileType(file.name) !== null
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!isFileSupported(file)) {
      toast({
        title: "Unsupported file type",
        description: "Please select a PDF, DOCX, TXT, image, or video file.",
        variant: "destructive"
      })
      return
    }

    // Check file size (max 10MB for documents, 5MB for others)
    const fileType = getFileType(file.name)
    const maxSize = (fileType?.type === 'pdf' || fileType?.type === 'docx' || fileType?.type === 'text') 
      ? 10 * 1024 * 1024 // 10MB for documents
      : 5 * 1024 * 1024  // 5MB for images/videos
    
    if (file.size > maxSize) {
      const sizeLimit = maxSize === 10 * 1024 * 1024 ? '10MB' : '5MB'
      toast({
        title: "File too large",
        description: `Please select a file smaller than ${sizeLimit}.`,
        variant: "destructive"
      })
      return
    }

    setSelectedFile(file)
  }

  const handleFileUpload = async () => {
    if (!selectedFile || !profile?._id) {
      toast({
        title: "Error",
        description: "Please select a file and ensure you're logged in.",
        variant: "destructive"
      })
      return
    }

    setUploading(true)
    setUploadProgress(0)
    setIsProcessing(true)

    try {
      // Step 1: Upload file to S3
      setUploadProgress(20)
      toast({
        title: "Uploading file...",
        description: "Please wait while we upload your file."
      })

      // Upload file using universal upload function
      const fileUrl = await uploadUniversalFile(profile?._id || '', selectedFile)
      
      setUploadProgress(40)
      
      // Step 2: Process with AI
      toast({
        title: "Processing with AI...",
        description: "Analyzing your file content and generating summary."
      })

      const fileType = getFileType(selectedFile.name)
      
      const result = await uploadDocumentEnhanced({
        userId: profile._id as string,
        fileUrl: fileUrl,
        fileName: selectedFile.name,
        fileType: fileType?.type
      })

      setUploadProgress(100)

      if (result.success) {
        const processedFile: ProcessedFile = {
          _id: result.document._id,
          document_name: result.document.document_name,
          status: result.document.status,
          summary: result.summary,
          file_type: fileType?.label || 'Unknown',
          link: result.document.link,
          created_at: result.document.created_at || new Date().toISOString()
        }

        setProcessedFiles(prev => [processedFile, ...prev])
        setActiveTab("results")
        
        toast({
          title: "Success!",
          description: `${fileType?.label} processed successfully with AI analysis.`
        })
      } else {
        throw new Error(result.message || 'Processing failed')
      }

    } catch (error: any) {
      console.error('Upload/processing error:', error)
      toast({
        title: "Processing failed",
        description: error.message || "There was an error processing your file.",
        variant: "destructive"
      })
    } finally {
      setUploading(false)
      setIsProcessing(false)
      setUploadProgress(0)
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const removeFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const FileTypeIcon = ({ file }: { file: File }) => {
    const fileType = getFileType(file.name)
    if (!fileType) return <File className="h-8 w-8 text-gray-400" />
    
    const IconComponent = fileType.icon
    return <IconComponent className="h-8 w-8 text-blue-500" />
  }

  return (
    <div className="space-y-6">


      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">Upload & Process</TabsTrigger>
          <TabsTrigger value="results">Results ({processedFiles.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Supported File Types</h3>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(supportedTypes).map(([type, config]) => {
                      const IconComponent = config.icon
                      return (
                        <Badge key={type} variant="outline" className={`${config.color} border-0`}>
                          <IconComponent className="h-3 w-3 mr-1" />
                          {config.label}
                        </Badge>
                      )
                    })}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Maximum file size: 5MB
                  </p>
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    accept=".pdf,.docx,.doc,.txt,.text,.jpg,.jpeg,.png,.gif,.bmp,.webp,.tiff,.tif,.mp4,.avi,.mov,.wmv,.flv,.webm,.mkv,.m4v,.3gp,.ogv"
                    className="hidden"
                  />
                  
                  {!selectedFile ? (
                    <div>
                      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Select a file to process</h3>
                      <p className="text-muted-foreground mb-4">
                        Choose a PDF, image, or video file for AI analysis
                      </p>
                      <Button onClick={() => fileInputRef.current?.click()}>
                        Choose File
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-center space-x-4">
                        <FileTypeIcon file={selectedFile} />
                        <div className="text-left">
                          <p className="font-medium">{selectedFile.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                          <Badge className={getFileType(selectedFile.name)?.color}>
                            {getFileType(selectedFile.name)?.label}
                          </Badge>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={removeFile}
                          disabled={uploading}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      {uploading && (
                        <div className="space-y-2">
                          <Progress value={uploadProgress} className="w-full" />
                          <p className="text-sm text-muted-foreground">
                            {uploadProgress < 40 ? 'Uploading...' : 
                             uploadProgress < 100 ? 'Processing with AI...' : 'Complete!'}
                          </p>
                        </div>
                      )}

                      <div className="flex space-x-2">
                        <Button
                          onClick={handleFileUpload}
                          disabled={uploading}
                          className="flex-1"
                        >
                          {uploading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-2" />
                              Process with AI
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                        >
                          Change File
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          {processedFiles.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No processed files yet</h3>
                <p className="text-muted-foreground">
                  Upload and process files to see results here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {processedFiles.map((file) => (
                <Card key={file._id}>
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        {file.status === 'Completed' ? (
                          <CheckCircle className="h-8 w-8 text-green-500" />
                        ) : file.status === 'Failed' ? (
                          <AlertCircle className="h-8 w-8 text-red-500" />
                        ) : (
                          <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                        )}
                      </div>
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold">{file.document_name}</h3>
                          <Badge variant={file.status === 'Completed' ? 'default' : 'secondary'}>
                            {file.status}
                          </Badge>
                          <Badge variant="outline">{file.file_type}</Badge>
                        </div>
                        
                        {file.summary && (
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="font-medium mb-2">AI Summary:</h4>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">
                              {file.summary}
                            </p>
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>
                            Processed: {new Date(file.created_at).toLocaleString()}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(file.link, '_blank')}
                          >
                            View File
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
