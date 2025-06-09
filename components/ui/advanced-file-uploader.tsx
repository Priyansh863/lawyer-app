"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Loader2, Upload, FileIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface FileUploaderProps {
  onFileProcessed: (file: File) => Promise<void>
  isProcessing: boolean
  allowedTypes?: string[]
  maxSize?: number // in bytes
}

export function FileUploader({
  onFileProcessed,
  isProcessing,
  allowedTypes = [],
  maxSize = 10 * 1024 * 1024, // 10MB default
}: FileUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    validateAndSetFile(file)
  }

  const validateAndSetFile = (file: File) => {
    // Check file type if allowedTypes is provided
    if (allowedTypes.length > 0) {
      const fileExtension = `.${file.name.split(".").pop()?.toLowerCase()}`
      if (!allowedTypes.includes(fileExtension)) {
        alert(`Invalid file type. Allowed types: ${allowedTypes.join(", ")}`)
        return
      }
    }

    // Check file size
    if (file.size > maxSize) {
      alert(`File too large. Maximum size is ${maxSize / (1024 * 1024)}MB`)
      return
    }

    setSelectedFile(file)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0])
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || isProcessing) return

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval)
          return prev
        }
        return prev + 5
      })
    }, 100)

    try {
      await onFileProcessed(selectedFile)
    } finally {
      clearInterval(interval)
      setUploadProgress(0)
    }
  }

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer",
          dragActive ? "border-primary bg-primary/5" : "border-gray-300",
          selectedFile ? "bg-gray-50" : "",
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
          disabled={isProcessing}
          accept={allowedTypes.join(",")}
        />

        {selectedFile ? (
          <div className="flex flex-col items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-full">
              <FileIcon size={24} className="text-primary" />
            </div>
            <div>
              <p className="font-medium">{selectedFile.name}</p>
              <p className="text-sm text-muted-foreground">{(selectedFile.size / 1024).toFixed(1)} KB</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="p-2 bg-gray-100 rounded-full">
              <Upload size={24} className="text-gray-500" />
            </div>
            <div className="space-y-1">
              <p className="font-medium">Drag and drop your file here</p>
              <p className="text-sm text-muted-foreground">or click to browse</p>
            </div>
            {allowedTypes.length > 0 && (
              <p className="text-xs text-muted-foreground">Allowed types: {allowedTypes.join(", ")}</p>
            )}
          </div>
        )}
      </div>

      {selectedFile && (
        <>
          {isProcessing && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>Processing...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-1" />
            </div>
          )}

          <Button onClick={handleUpload} disabled={isProcessing} className="w-full">
            {isProcessing ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              "Upload File"
            )}
          </Button>
        </>
      )}
    </div>
  )
}
