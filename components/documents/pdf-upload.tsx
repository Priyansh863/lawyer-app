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
import { toast } from 'sonner'

interface PDFUploadEnhancedProps {
  isOpen: boolean
  onClose: () => void
  onUploadSuccess: () => void
}

export default function PDFUpload({ isOpen, onClose, onUploadSuccess }: PDFUploadEnhancedProps) {
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
      toast.error(validation.error)
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
      toast.error('Please select a file and ensure you are logged in')
      return
    }

    // Lawyers cannot upload private documents
    if (isLawyer && privacy === 'private') {
      toast.error('Lawyers can only upload public documents')
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Step 1: Upload to S3 (50% progress)
      setUploadProgress(25)
      const fileUrl = await uploadPDFToS3(file, user._id)

      // Step 2: Save to backend (50% progress)
      setUploadProgress(50)
      const uploadData = {
        userId: user._id,
        fileUrl,
        fileName: file.name
      }

      setUploadProgress(75)
      const result = await uploadDocument(uploadData as any)

      if (result.success) {
        setUploadProgress(100)
        toast.success(`Document uploaded successfully as ${privacy}`)
        
        // Reset form
        setFile(null)
        setPrivacy('public')
        setProcessWithAI(true)
        
        // Close dialog and refresh documents
        onClose()
        onUploadSuccess()
      } else {
        throw new Error(result.message || 'Upload failed')
      }
    } catch (error: any) {
      console.error('Upload error:', error)
      toast.error(error.message || 'Failed to upload document')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const resetForm = () => {
    setFile(null)
    setPrivacy('public')
    setProcessWithAI(true)
    setUploadProgress(0)
  }

  const handleClose = () => {
    if (!isUploading) {
      resetForm()
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Document
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragActive
                ? 'border-blue-500 bg-blue-50'
                : file
                ? 'border-green-500 bg-green-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {file ? (
              <div className="flex items-center justify-center gap-2 text-green-600">
                <FileText className="h-8 w-8" />
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-8 w-8 mx-auto text-gray-400" />
                <p className="text-gray-600">
                  Drag and drop your PDF here, or{' '}
                  <label className="text-blue-600 hover:text-blue-700 cursor-pointer underline">
                    browse
                    <Input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileInputChange}
                      className="hidden"
                    />
                  </label>
                </p>
                <p className="text-xs text-gray-500">PDF files only, max 10MB</p>
              </div>
            )}
          </div>

          {/* Privacy Settings */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Document Privacy</Label>
            <RadioGroup
              value={privacy}
              onValueChange={(value: 'public' | 'private') => setPrivacy(value)}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <RadioGroupItem value="public" id="public" />
                <Globe className="h-4 w-4 text-green-600" />
                <div className="flex-1">
                  <Label htmlFor="public" className="font-medium">
                    Public
                  </Label>
                  <p className="text-xs text-gray-500">
                    Visible to you and can be accessed by lawyers
                  </p>
                </div>
              </div>
              
              <div className={`flex items-center space-x-2 p-3 border rounded-lg ${
                isLawyer ? 'opacity-50 cursor-not-allowed' : ''
              }`}>
                <RadioGroupItem 
                  value="private" 
                  id="private" 
                  disabled={isLawyer}
                />
                <Lock className="h-4 w-4 text-blue-600" />
                <div className="flex-1">
                  <Label htmlFor="private" className="font-medium">
                    Private
                  </Label>
                  <p className="text-xs text-gray-500">
                    Only visible to you. You can share with specific lawyers later.
                  </p>
                </div>
              </div>
            </RadioGroup>

            {isLawyer && (
              <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-md">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <p className="text-xs text-amber-700">
                  Lawyers can only upload public documents
                </p>
              </div>
            )}
          </div>

          {/* AI Processing Option */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="processWithAI"
              checked={processWithAI}
              onChange={(e) => setProcessWithAI(e.target.checked)}
              className="rounded border-gray-300"
            />
            <Label htmlFor="processWithAI" className="text-sm">
              Process with AI for automatic summary generation
            </Label>
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
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
              {isUploading ? 'Uploading...' : 'Upload'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
