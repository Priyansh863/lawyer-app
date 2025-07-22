"use client"

import { useState, useRef } from "react"
import { useSelector } from "react-redux"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { FileText, Upload, Loader2 } from "lucide-react"
import { FileUploader } from "@/components/ui/advanced-file-uploader"
import { FileOutput } from "@/components/ai-assistants/file-output"
import { SecureLinkGenerator } from "@/components/ai-assistants/secure-link-generator"
import { processFile, generateSummary } from "@/lib/api/ai-assistants-api"
import { useToast } from "@/hooks/use-toast"
import { getUploadFileUrl } from "@/lib/helpers/fileupload"
import { uploadDocumentWithSummary } from "@/lib/api/documents-api"
import { RootState } from "@/lib/store"
import type { ProcessedFile } from "@/types/ai-assistant"

export default function FileProcessor() {
  const [activeTab, setActiveTab] = useState("upload")
  const [processedFile, setProcessedFile] = useState<ProcessedFile | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)
  
  // PDF Summary state
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [pdfUploading, setPdfUploading] = useState(false)
  const [pdfUploadProgress, setPdfUploadProgress] = useState(0)
  const [pdfSummary, setPdfSummary] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const { toast } = useToast()
  const profile = useSelector((state: RootState) => state.auth.user)

  const handleFileProcessed = async (file: File) => {
    setIsProcessing(true)
    try {
      const result = await processFile(file, profile?._id as string)
      setProcessedFile(result as ProcessedFile)
      setActiveTab("output")
      toast({
        title: "File processed",
        description: "Your file has been processed successfully",
      })
    } catch (error) {
      toast({
        title: "Processing failed",
        description: "There was an error processing your file",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleGenerateSummary = async () => {
    if (!processedFile) return

    setIsGeneratingSummary(true)
    try {
      const result = await generateSummary(processedFile.id)
      setProcessedFile({
        ...processedFile,
        summary: result.summary,
      })
      toast({
        title: "Summary generated",
        description: "Your summary has been generated successfully",
      })
    } catch (error) {
      toast({
        title: "Summary generation failed",
        description: "There was an error generating the summary",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingSummary(false)
    }
  }

  // PDF Upload and Summary functions
  const handlePdfFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate PDF file
    if (file.type !== 'application/pdf') {
      toast({
        title: "Invalid File",
        description: "Only PDF files are allowed",
        variant: "destructive",
      })
      return
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "File size must be less than 10MB",
        variant: "destructive",
      })
      return
    }

    setPdfFile(file)
    setPdfSummary(null) // Reset previous summary
  }

  const handlePdfUploadAndSummary = async () => {
    if (!pdfFile || !profile?._id) {
      toast({
        title: "Error",
        description: "Please select a PDF file and ensure you're logged in",
        variant: "destructive",
      })
      return
    }

    try {
      setPdfUploading(true)
      setPdfUploadProgress(10)

      // Read file and upload using presigned URL (similar to profile settings)
      const reader = new FileReader()
      reader.onloadend = async () => {
        try {
          const fileFormat = pdfFile.type.split("/")[1]
          const fileData = {
            data: reader.result,
            format: fileFormat,
          }

          setPdfUploadProgress(30)
          const fileUrl = await getUploadFileUrl(profile._id as string, fileData)
          
          if (!fileUrl) {
            throw new Error("Failed to upload file")
          }

          setPdfUploadProgress(60)

          // Call upload-with-summary API using the documents API
          const result = await uploadDocumentWithSummary({
            userId: profile._id as string,
            fileUrl: fileUrl,
            fileName: pdfFile.name,
          })


          console.log(result, "sssssssssssssss")

          setPdfUploadProgress(100)

          if (result.success && result.summary) {
            setPdfSummary(result.summary)
            toast({
              title: "Success!",
              description: "PDF uploaded and summary generated successfully",
              variant: "default",
            })
            // Reset file input to allow another upload
            setPdfFile(null)
            if (fileInputRef.current) {
              fileInputRef.current.value = ''
            }
          } else {
            throw new Error(result.message || "Failed to process PDF")
          }

        } catch (error: any) {
          console.error('PDF upload error:', error)
          toast({
            title: "Upload Failed",
            description: error.message || "Failed to upload and process PDF",
            variant: "destructive",
          })
        } finally {
          setPdfUploading(false)
          setPdfUploadProgress(0)
        }
      }
      reader.readAsDataURL(pdfFile)

    } catch (error: any) {
      console.error('PDF processing error:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to process PDF",
        variant: "destructive",
      })
      setPdfUploading(false)
      setPdfUploadProgress(0)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <Card>
      <CardContent className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
  

          <TabsContent value="upload" className="space-y-4">
            <div className="text-center p-8 border-2 border-dashed rounded-lg">
              <div className="flex justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-8 w-8 text-gray-400"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <p className="text-sm text-muted-foreground mb-1">Upload file here</p>
              <p className="text-xs text-muted-foreground mb-4">
                [pdf, txt, docx, xlsx, jpg, png, mp3, mp4], automatic text extraction (ACR, OCR)
              </p>
              <FileUploader
                onFileProcessed={handleFileProcessed}
                isProcessing={isProcessing}
                allowedTypes={[".pdf", ".txt", ".docx", ".xlsx", ".jpg", ".jpeg", ".png", ".mp3", ".mp4"]}
                maxSize={50 * 1024 * 1024} // 50MB
              />
            </div>
          </TabsContent>

          <TabsContent value="pdf-summary" className="space-y-4">
            <div className="space-y-4">
              <div className="text-center p-8 border-2 border-dashed rounded-lg">
                <div className="flex justify-center mb-4">
                  <FileText className="h-8 w-8 text-red-600" />
                </div>
                <p className="text-sm text-muted-foreground mb-1">Upload PDF for AI Summary</p>
                <p className="text-xs text-muted-foreground mb-4">
                  Upload a PDF document to get an AI-generated summary
                </p>
                
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handlePdfFileSelect}
                  disabled={pdfUploading}
                  className="mb-4 cursor-pointer"
                />
                
                {pdfFile && (
                  <div className="flex items-center justify-center space-x-2 mb-4 p-3 bg-muted rounded-lg">
                    <FileText className="h-4 w-4 text-red-600" />
                    <div className="text-left">
                      <p className="text-sm font-medium">{pdfFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(pdfFile.size)}
                      </p>
                    </div>
                  </div>
                )}
                
                {pdfUploading && (
                  <div className="space-y-2 mb-4">
                    <Progress value={pdfUploadProgress} className="w-full" />
                    <p className="text-xs text-center text-muted-foreground">
                      Processing... {pdfUploadProgress}%
                    </p>
                  </div>
                )}
                
                <Button
                  onClick={handlePdfUploadAndSummary}
                  disabled={!pdfFile || pdfUploading}
                  className="w-full"
                >
                  {pdfUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload & Generate Summary
                    </>
                  )}
                </Button>
              </div>
              
              {pdfSummary && (
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4">AI Generated Summary</h3>
                    <div className="prose max-w-none">
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {pdfSummary}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="output" className="space-y-4">
            {processedFile && (
              <FileOutput
                processedFile={processedFile}
                onGenerateSummary={handleGenerateSummary}
                isGeneratingSummary={isGeneratingSummary}
              />
            )}
          </TabsContent>

          <TabsContent value="secure-link" className="space-y-4">
            <SecureLinkGenerator processedFile={processedFile} />
          </TabsContent>

        </Tabs>
      </CardContent>
    </Card>
  )
}
