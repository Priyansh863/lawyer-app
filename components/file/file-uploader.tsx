"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Upload, Loader2 } from "lucide-react"
import { uploadFile } from "../../lib/file-service"

export function FileUploader() {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setIsUploading(true)

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

      // Call the upload service
      await uploadFile({
        file,
        onProgress: (progress) => {
          setUploadProgress(progress)
        },
        storageLocation: "s3", // or "local" based on user preference
      })

      clearInterval(interval)
      setUploadProgress(100)

      // Reset after a delay
      setTimeout(() => {
        setIsUploading(false)
        setUploadProgress(0)
      }, 1000)
    } catch (error) {
      console.error("Upload failed:", error)
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  return (
    <div className="space-y-2">
      <input type="file" id="file-upload" className="hidden" onChange={handleFileChange} disabled={isUploading} />
      <label htmlFor="file-upload">
        <Button variant="outline" className="w-full justify-start gap-2" disabled={isUploading} asChild>
          <span>
            {isUploading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Uploading... {uploadProgress}%
              </>
            ) : (
              <>
                <Upload size={16} />
                Upload File
              </>
            )}
          </span>
        </Button>
      </label>

      {isUploading && (
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div
            className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}
    </div>
  )
}
