'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Progress } from '@/components/ui/progress'
import { Upload, FileText, Lock, Globe, AlertCircle } from 'lucide-react'
import { useSelector } from 'react-redux'
import { RootState } from '@/lib/store'
import { uploadPDFToS3, validatePDFFile } from '@/lib/helpers/pdf-upload'
import { uploadDocument } from '@/lib/api/documents-api'
import { useTranslation } from '@/hooks/useTranslation'
import { toast } from 'sonner'

interface PDFUploadEnhancedProps {
  isOpen: boolean
  onClose: () => void
  onUploadSuccess: () => void
}

export default function PDFUpload({ isOpen, onClose, onUploadSuccess }: PDFUploadEnhancedProps) {
  const { t } = useTranslation()
  const [file, setFile] = useState<File | null>(null)
  const [privacy, setPrivacy] = useState<'public' | 'private'>('public')
  const [processWithAI, setProcessWithAI] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragActive, setDragActive] = useState(false)

  // Get user from Redux store
  const user = useSelector((state: RootState) => state.auth.user)
  const isLawyer = user?.account_type === 'lawyer'

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0])
    }
  }

  const handleFileSelection = (selectedFile: File) => {
    const validation = validatePDFFile(selectedFile)
    if (!validation.isValid) {
      toast.error(t("pages:pdfUpload.invalidFile"))
      return
    }
    setFile(selectedFile)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!file || !user?._id) {
      toast.error(t("pages:pdfUpload.selectFileOrLogin"))
      return
    }

    // Lawyers cannot upload private documents
    if (isLawyer && privacy === 'private') {
      toast.error(t("pages:pdfUpload.lawyersPublicOnly"))
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Step 1: Upload to S3 (50% progress)
      setUploadProgress(25)
      const fileUrl = await uploadPDFToS3(file, user._id)

      if (!fileUrl) {
        throw new Error(t("pages:pdfUpload.uploadFailStorage"))
      }

      // Step 2: Save to database (75% progress)
      const uploadData = {
        userId: user._id,
        fileUrl: fileUrl,
        fileName: file.name,
        privacy: privacy,
        processWithAI: processWithAI,
        fileSize: file.size,
        fileType: 'PDF'
      }

      setUploadProgress(75)
      const result = await uploadDocument(uploadData as any)

      if (result.success) {
        setUploadProgress(100)
        toast.success(t("pages:pdfUpload.successTitle"))
        
        // Reset form
        setFile(null)
        setUploadProgress(0)
        onUploadSuccess()
        onClose()
      } else {
        throw new Error(result.message || t("pages:pdfUpload.uploadFailed"))
      }
    } catch (error: any) {
      console.error('Upload error:', error)
      toast.error(t("pages:pdfUpload.uploadFailedTitle"))
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleClose = () => {
    if (!isUploading) {
      setFile(null)
      setUploadProgress(0)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            {t("pages:pdfUpload.title")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragActive
                ? 'border-primary bg-primary/5'
                : file
                ? 'border-green-300 bg-green-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {file ? (
              <div className="space-y-2">
                <FileText className="h-8 w-8 mx-auto text-green-600" />
                <div>
                  <p className="font-medium text-green-700">{file.name}</p>
                  <p className="text-sm text-green-600">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-8 w-8 mx-auto text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    {t("pages:pdfUpload.dragDropText")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {t("pages:pdfUpload.pdfRules")}
                  </p>
                </div>
              </div>
            )}

            <Input
              type="file"
              accept=".pdf"
              onChange={handleFileInputChange}
              className="hidden"
              id="file-upload"
              disabled={isUploading}
            />
            
            {!file && (
              <Label
                htmlFor="file-upload"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 cursor-pointer mt-4"
              >
                {t("pages:pdfUpload.selectFile")}
              </Label>
            )}
          </div>

          {/* Privacy Settings */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              {privacy === 'private' ? <Lock className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
              {t("pages:pdfUpload.docVisibility")}
            </Label>
            <RadioGroup
              value={privacy}
              onValueChange={(value: 'public' | 'private') => setPrivacy(value)}
              className="flex space-x-6"
              disabled={isLawyer} // Lawyers can only upload public documents
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="public" id="public" />
                <Label htmlFor="public" className="text-sm">
                  <Globe className="h-4 w-4 inline mr-1" />
                  {t("pages:pdfUpload.public")}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="private" id="private" disabled={isLawyer} />
                <Label htmlFor="private" className={`text-sm ${isLawyer ? 'opacity-50' : ''}`}>
                  <Lock className="h-4 w-4 inline mr-1" />
                  {t("pages:pdfUpload.private")}
                </Label>
              </div>
            </RadioGroup>
            
            {isLawyer && (
              <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded">
                <AlertCircle className="h-4 w-4" />
                {t("pages:pdfUpload.lawyerNote")}
              </div>
            )}
            
            <p className="text-xs text-muted-foreground">
              {privacy === 'private' 
                ? t("pages:pdfUpload.privateHelp")
                : t("pages:pdfUpload.publicHelp")
              }
            </p>
          </div>

          {/* AI Processing Option */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="processWithAI"
              checked={processWithAI}
              onChange={(e) => setProcessWithAI(e.target.checked)}
              className="rounded border-gray-300"
              disabled={isUploading}
            />
            <Label htmlFor="processWithAI" className="text-sm font-medium">
              {t("pages:pdfUpload.processWithAI")}
            </Label>
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{t("pages:pdfUpload.uploading")}</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isUploading}
            >
              {t("pages:pdfUpload.cancel")}
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!file || isUploading}
              className="min-w-[100px]"
            >
              {isUploading ? t("pages:pdfUpload.uploading") : t("pages:pdfUpload.uploadPDF")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
