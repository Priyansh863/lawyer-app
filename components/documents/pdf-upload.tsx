'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Upload, FileText, Lock, Globe, AlertCircle, Video, Image, File, X } from 'lucide-react'
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
    label: 'PDF',
    maxSize: 10 * 1024 * 1024 // 10MB
  },
  docx: {
    extensions: ['.docx', '.doc'],
    icon: FileText,
    color: 'bg-blue-100 text-blue-800',
    label: 'Word',
    maxSize: 10 * 1024 * 1024 // 10MB
  },
  text: {
    extensions: ['.txt', '.text'],
    icon: File,
    color: 'bg-green-100 text-green-800',
    label: 'Text',
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
      toast.error(t("pages:cases.error.fetchingCases"))
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
      toast.error(t("pages:upload.error.unsupportedType"))
      return
    }
    
    if (selectedFile.size > fileType.maxSize) {
      const maxSizeMB = Math.round(fileType.maxSize / (1024 * 1024))
      toast.error(t("pages:upload.error.sizeExceeded", { size: maxSizeMB, type: t(`pages:upload.fileTypes.${fileType.label.toLowerCase()}`) }))
      return
    }
    
    setFile(selectedFile)
    setFileTypeInfo(fileType)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0])
    }
  }

  const handleRemoveFile = () => {
    setFile(null)
    setFileTypeInfo(null)
    // Reset the file input
    const fileInput = document.getElementById('file-upload') as HTMLInputElement
    if (fileInput) {
      fileInput.value = ''
    }
  }

  const handleUpload = async () => {
    if (!file || !user?._id) {
      toast.error(t("pages:upload.error.missingFileOrAuth"))
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      setUploadProgress(25)
      const fileUrl = await uploadPDFToS3(file, user._id)

      if (!fileUrl) {
        throw new Error(t("pages:upload.error.storageFailed"))
      }

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
        toast.success(t("pages:upload.success.message"))
        
        setFile(null)
        setFileTypeInfo(null)
        setUploadProgress(0)
        onUploadSuccess()
        onClose()
      } else {
        throw new Error(result.message || t("pages:upload.error.general"))
      }
    } catch (error: any) {
      console.error('Upload error:', error)
      toast.error(error.message || t("pages:upload.error.general"))
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
      setPrivacy('public')
      setSelectedCaseId('')
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            {t("pages:upload.title")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Fixed Top Section - File Upload Area */}
          <div className="space-y-4">
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
                <div className="space-y-2 relative">
                  {/* Remove button */}
                  <button
                    onClick={handleRemoveFile}
                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-md transition-colors z-10"
                    disabled={isUploading}
                    title="Remove file"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  
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
                        {t(`pages:upload.fileTypes.${fileTypeInfo.label.toLowerCase()}`)}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-8 w-8 mx-auto text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      {t("pages:upload.dragDrop")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {t("pages:upload.supportedFormats")}
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
                  {t("pages:upload.selectFile")}
                </Label>
              )}
            </div>

            {/* Privacy Settings - Always visible but compact */}
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                {privacy === 'private' || privacy === 'fully_private' ? <Lock className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
                {t("pages:upload.privacySettings")}
              </Label>
              <RadioGroup
                value={privacy}
                onValueChange={(value: 'public' | 'private' | 'fully_private') => {
                  setPrivacy(value)
                  if (value !== 'private') {
                    setSelectedCaseId('')
                  }
                }}
                className="grid grid-cols-3 gap-2"
              >
                <div className="flex flex-col items-center space-y-1 p-2 border rounded-md">
                  <RadioGroupItem value="public" id="public" className="mt-1" />
                  <Label htmlFor="public" className="text-xs text-center flex flex-col items-center">
                    <Globe className="h-3 w-3 mb-1" />
                    {t("pages:upload.privacy.public")}
                  </Label>
                </div>
                <div className="flex flex-col items-center space-y-1 p-2 border rounded-md">
                  <RadioGroupItem value="private" id="private" className="mt-1" />
                  <Label htmlFor="private" className="text-xs text-center flex flex-col items-center">
                    <Lock className="h-3 w-3 mb-1" />
                    {t("pages:upload.privacy.private")}
                  </Label>
                </div>
                <div className="flex flex-col items-center space-y-1 p-2 border rounded-md">
                  <RadioGroupItem value="fully_private" id="fully_private" className="mt-1" />
                  <Label htmlFor="fully_private" className="text-xs text-center flex flex-col items-center">
                    <Lock className="h-3 w-3 mb-1" />
                    {t("pages:upload.privacy.fullyPrivate")}
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* AI Processing Option - Always visible */}
            <div className="flex items-center space-x-2 pt-2">
              <input
                type="checkbox"
                id="processWithAI"
                checked={processWithAI}
                onChange={(e) => setProcessWithAI(e.target.checked)}
                className="rounded border-gray-300"
                disabled={isUploading}
              />
              <Label htmlFor="processWithAI" className="text-sm font-medium">
                {t("pages:upload.aiProcessing")}
              </Label>
            </div>
          </div>

          {/* Dynamic Bottom Section - Case Selection appears here when privacy is private */}
          {privacy === 'private' && (
            <div className="pt-2 border-t animate-in fade-in-50 slide-in-from-bottom-2">
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  {t("pages:upload.associateWithCase")}
                </Label>
                <Select 
                  value={selectedCaseId} 
                  onValueChange={setSelectedCaseId}
                  disabled={loadingCases}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingCases ? t("pages:upload.loadingCases") : t("pages:upload.selectCasePlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{t("pages:upload.noCaseAssociation")}</SelectItem>
                    {availableCases.map((caseItem) => (
                      <SelectItem key={caseItem.id} value={caseItem.id}>
                        {caseItem.case_number} - {caseItem.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedCaseId && (
                  <p className="text-xs text-gray-500">
                    {t("pages:upload.caseAssociationNote")}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2 pt-2">
              <div className="flex justify-between text-sm">
                <span>{t("pages:upload.uploading")}</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isUploading}
            >
              {t("pages:commons.cancel")}
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!file || isUploading}
              className="min-w-[100px]"
            >
              {isUploading ? t("pages:upload.uploadingButton") : t("pages:upload.uploadButton")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}