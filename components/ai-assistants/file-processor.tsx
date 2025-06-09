"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileUploader } from "@/components/ui/advanced-file-uploader"
import { FileOutput } from "@/components/ai-assistants/file-output"
import { SecureLinkGenerator } from "@/components/ai-assistants/secure-link-generator"
import { processFile, generateSummary } from "@/lib/api/ai-assistants-api"
import { useToast } from "@/hooks/use-toast"
import type { ProcessedFile } from "@/types/ai-assistant"

export default function FileProcessor() {
  const [activeTab, setActiveTab] = useState("upload")
  const [processedFile, setProcessedFile] = useState<ProcessedFile | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)
  const { toast } = useToast()

  const handleFileProcessed = async (file: File) => {
    setIsProcessing(true)
    try {
      const result = await processFile(file)
      setProcessedFile(result)
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

  return (
    <Card>
      <CardContent className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="output" disabled={!processedFile}>
              Output
            </TabsTrigger>
            <TabsTrigger value="secure-link">Secure Link</TabsTrigger>
          </TabsList>

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
