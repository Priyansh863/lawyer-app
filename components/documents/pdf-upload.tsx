'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Upload, FileText, Lock, Globe, AlertCircle, Video, Image, File } from 'lucide-react'
import { useSelector } from 'react-redux'
import { RootState } from '@/lib/store'
import { uploadPDFToS3, validatePDFFile } from '@/lib/helpers/pdf-upload'
import { uploadDocumentEnhanced } from '@/lib/api/documents-api'
import { useTranslation } from '@/hooks/useTranslation'
import { toast } from 'sonner'
import { casesApi } from '@/lib/api/cases-api'
import type { Case } from '@/types/case'

interface PDFUploadEnhancedProps {
  isOpen: boolean
  onClose: () => void
  onUploadSuccess: () => void
  caseId?: string
}

interface FileTypeConfig {
  extensions: string[]
  icon: any
  color: string
  label: string
  maxSize: number
}

const FILE_TYPES: Record<string, FileTypeConfig> = {
  pdf: {
    extensions: ['.pdf'],
    icon: FileText,
    color: 'bg-red-100 text-red-800',
    label: 'PDF Document',
    maxSize: 10 * 1024 * 1024 // 10MB
  },
  docx: {
    extensions: ['.docx', '.doc'],
    icon: FileText,
    color: 'bg-blue-100 text-blue-800',
    label: 'Word Document',
    maxSize: 10 * 1024 * 1024 // 10MB
  },
  text: {
    extensions: ['.txt', '.text'],
    icon: File,
    color: 'bg-green-100 text-green-800',
    label: 'Text File',
    maxSize: 10 * 1024 * 1024 // 10MB
  },
  image: {
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    icon: Image,
    color: 'bg-purple-100 text-purple-800',
    label: 'Image',
    maxSize: 5 * 1024 * 1024 // 5MB
  },
  video: {
    extensions: ['.mp4', '.avi', '.mov', '.wmv', '.flv'],
    icon: Video,
    color: 'bg-orange-100 text-orange-800',
    label: 'Video',
    maxSize: 50 * 1024 * 1024 // 50MB
  }
}

export default function PDFUpload({ isOpen, onClose, onUploadSuccess, caseId }: PDFUploadEnhancedProps) {
  const { t } = useTranslation()
  const [file, setFile] = useState<File | null>(null)
  const [privacy, setPrivacy] = useState<'public' | 'private' | 'fully_private'>('public')
  const [processWithAI, setProcessWithAI] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragActive, setDragActive] = useState(false)
  const [fileTypeInfo, setFileTypeInfo] = useState<FileTypeConfig | null>(null)
  const [selectedCaseId, setSelectedCaseId] = useState<string>(caseId || '')
  const [availableCases, setAvailableCases] = useState<Case[]>([])
  const [loadingCases, setLoadingCases] = useState(false)
  const user = useSelector((state: RootState) => state.auth.user)
  const isLawyer = user?.account_type === 'lawyer'

  // Fetch available cases when dialog opens
  React.useEffect(() => {
    if (isOpen && user) {
      fetchAvailableCases()
    }
  }, [isOpen, user])

  const fetchAvailableCases = async () => {
    setLoadingCases(true)
    try {
      const response = await casesApi.getCases({ limit: 100 })
      setAvailableCases(response.cases || [])
    } catch (error) {
      console.error('Error fetching cases:', error)
      toast.error('Failed to load available cases')
    } finally {
      setLoadingCases(false)
    }
  }

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

  const getFileType = (fileName: string): FileTypeConfig | null => {
    const extension = '.' + fileName.split('.').pop()?.toLowerCase()
    for (const [type, config] of Object.entries(FILE_TYPES)) {
      if (config.extensions.includes(extension)) {
        return config
      }
    }
    return null
  }

  const handleFileSelection = (selectedFile: File) => {
    const fileType = getFileType(selectedFile.name)
    
    if (!fileType) {
      toast.error('Unsupported file type. Please upload PDF, DOCX, TXT, image, or video files.')
      return
    }
    
    if (selectedFile.size > fileType.maxSize) {
      const maxSizeMB = Math.round(fileType.maxSize / (1024 * 1024))
      toast.error(`File size exceeds ${maxSizeMB}MB limit for ${fileType.label}`)
      return
    }
    
    setFile(selectedFile)
    setFileTypeInfo(fileType)
    
    // Case ID handling is now done in privacy selection
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!file || !user?._id) {
      toast.error('Please select a file and ensure you are logged in')
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Step 1: Upload to S3 (25% progress)
      setUploadProgress(25)
      const fileUrl = await uploadPDFToS3(file, user._id)

      if (!fileUrl) {
        throw new Error('Failed to upload file to storage')
      }

      // Step 2: Save to database with enhanced data (75% progress)
      setUploadProgress(75)
      const uploadData = {
        userId: user._id,
        fileUrl: fileUrl,
        fileName: file.name,
        fileType: fileTypeInfo?.label || 'Document',
        privacy: privacy,
        processWithAI: processWithAI,
        fileSize: file.size,
        documentType: 'general' as const,
        caseId: privacy === 'private' && selectedCaseId ? selectedCaseId : undefined
      }

      const result = await uploadDocumentEnhanced(uploadData)

      if (result.success) {
        setUploadProgress(100)
        toast.success('Document uploaded successfully!')
        
        // Reset form
        setFile(null)
        setFileTypeInfo(null)
        setUploadProgress(0)
        onUploadSuccess()
        onClose()
      } else {
        throw new Error(result.message || 'Upload failed')
      }
    } catch (error: any) {
      console.error('Upload error:', error)
      toast.error('Failed to upload document')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleClose = () => {
    if (!isUploading) {
      setFile(null)
      setFileTypeInfo(null)
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
                {fileTypeInfo && (
                  <div className="flex items-center justify-center">
                    <fileTypeInfo.icon className="h-8 w-8 text-green-600" />
                  </div>
                )}
                <div>
                  <p className="font-medium text-green-700">{file.name}</p>
                  <p className="text-sm text-green-600">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  {fileTypeInfo && (
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${fileTypeInfo.color}`}>
                      {fileTypeInfo.label}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-8 w-8 mx-auto text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Drag and drop your file here, or click to select
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Supports PDF, DOCX, TXT, images (JPG, PNG), and videos (MP4, AVI)
                  </p>
                </div>
              </div>
            )}

            <Input
              type="file"
              accept=".pdf,.docx,.doc,.txt,.text,.jpg,.jpeg,.png,.gif,.webp,.mp4,.avi,.mov,.wmv,.flv"
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
                Select File
              </Label>
            )}
          </div>

          {/* Case Selection - Only for Private Documents */}
          {privacy === 'private' && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Associate with Case (Optional)</Label>
              <Select 
                value={selectedCaseId} 
                onValueChange={setSelectedCaseId}
                disabled={loadingCases}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingCases ? "Loading cases..." : "Select a case (optional)"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No case association</SelectItem>
                  {availableCases.map((caseItem) => (
                    <SelectItem key={caseItem.id} value={caseItem.id}>
                      {caseItem.case_number} - {caseItem.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedCaseId && (
                <p className="text-xs text-gray-500">
                  This document will be associated with the selected case.
                </p>
              )}
            </div>
          )}



          {/* Privacy Settings */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              {privacy === 'private' || privacy === 'fully_private' ? <Lock className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
              Document Privacy
            </Label>
            <RadioGroup
              value={privacy}
              onValueChange={(value: 'public' | 'private' | 'fully_private') => {
                setPrivacy(value)
                // Clear case selection if not private
                if (value !== 'private') {
                  setSelectedCaseId('')
                }
              }}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="public" id="public" />
                <Label htmlFor="public" className="text-sm">
                  <Globe className="h-4 w-4 inline mr-1" />
                  Public - Visible to all authenticated users
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="private" id="private" />
                <Label htmlFor="private" className="text-sm">
                  <Lock className="h-4 w-4 inline mr-1" />
                  Private - Visible to you and shared users (can be associated with cases)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="fully_private" id="fully_private" />
                <Label htmlFor="fully_private" className="text-sm">
                  <Lock className="h-4 w-4 inline mr-1" />
                  Fully Private - Visible only to you
                </Label>
              </div>
            </RadioGroup>
            
      
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
              Process with AI (automatic summarization for text documents)
            </Label>
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading document...</span>
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
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!file || isUploading}
              className="min-w-[100px]"
            >
              {isUploading ? 'Uploading...' : 'Upload Document'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
