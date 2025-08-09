"use client"
import { useState, useRef, useEffect } from "react"
import type React from "react"

import { useSelector } from "react-redux"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Upload, FileText, X, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { uploadPDFToS3, validatePDFFile } from "@/lib/helpers/pdf-upload"
import { uploadDocument } from "@/lib/api/documents-api"
import type { RootState } from "@/lib/store"
import MultiSelect from "@/components/ui/multi-select"
import { useTranslation } from "@/hooks/useTranslation" // <-- Add translation hook!

interface PDFUploadProps {
  onUploadSuccess?: () => void
  trigger?: React.ReactNode
}

export function PDFUpload({ onUploadSuccess, trigger }: PDFUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [open, setOpen] = useState(false)
  const [privacySetting, setPrivacySetting] = useState<"private" | "public">("private")
  const [allowedUsers, setAllowedUsers] = useState<string[]>([]) // user _id array
  const [userOptions, setUserOptions] = useState<{ label: string; value: string }[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const profile = useSelector((state: RootState) => state.auth.user)
  const { t } = useTranslation() // <-- Initialize translation

  // Fetch user list for sharing (lawyers/clients)
  useEffect(() => {
    async function fetchUsers() {
      const res = await fetch("/api/user/all-users")
      const data = await res.json()
      setUserOptions(data.users.map((u: any) => ({
        label: `${u.first_name} ${u.last_name} (${u.email})`,
        value: u._id
      })))
    }
    if (privacySetting === "public") {
      fetchUsers()
    }
  }, [privacySetting])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const validation = validatePDFFile(file)
    if (!validation.isValid) {
      toast({
        title: t("pages:pdfUpload.invalidFileTitle"),
        description: validation.error,
        variant: "destructive",
      })
      return
    }
    setSelectedFile(file)
  }

  const handleUpload = async () => {
    if (!selectedFile || !profile?._id) {
      toast({
        title: t("pages:pdfUpload.errorTitle"),
        description: t("pages:pdfUpload.selectFileOrLogin"),
        variant: "destructive",
      })
      return
    }
    if (privacySetting === "public" && allowedUsers.length === 0) {
      toast({
        title: t("pages:pdfUpload.errorTitle"),
        description: t("pages:pdfUpload.selectShareUsers"),
        variant: "destructive",
      })
      return
    }

    try {
      setUploading(true)
      setUploadProgress(10)
      toast({
        title: t("pages:pdfUpload.uploading"),
        description: t("pages:pdfUpload.uploadingDesc"),
      })

      setUploadProgress(30)
      const fileUrl = await uploadPDFToS3(selectedFile, profile._id)
      if (!fileUrl) throw new Error(t("pages:pdfUpload.uploadFailStorage"))
      setUploadProgress(70)

      const documentData = {
        userId: profile._id,
        fileUrl: fileUrl,
        fileName: selectedFile.name,
        isPublic: privacySetting === "public",
        allowedUsers: privacySetting === "public" ? allowedUsers : [],
      }
      const response = await uploadDocument(documentData)
      if (!response.success) throw new Error(response.message || t("pages:pdfUpload.uploadFailSave"))
      setUploadProgress(100)

      toast({
        title: t("pages:pdfUpload.successTitle"),
        description: t("pages:pdfUpload.successDesc"),
        variant: "default",
      })

      setSelectedFile(null)
      setUploadProgress(0)
      setOpen(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
      onUploadSuccess?.()
      setAllowedUsers([])
    } catch (error: any) {
      console.error("Upload error:", error)
      toast({
        title: t("pages:pdfUpload.uploadFailedTitle"),
        description: error.message || t("pages:pdfUpload.uploadFailedDesc"),
        variant: "destructive",
      })
      setUploadProgress(0)
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Upload className="mr-2 h-4 w-4" />
            {t("pages:pdfUpload.triggerUploadPDF")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("pages:pdfUpload.title")}</DialogTitle>
          <DialogDescription>{t("pages:pdfUpload.description")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          
          {/* File Input */}
          <div className="space-y-2">
            <Input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              disabled={uploading}
              className="cursor-pointer"
            />
            <p className="text-xs text-muted-foreground">
              {t("pages:pdfUpload.pdfRules")}
            </p>
          </div>

          {/* Selected File Display */}
          {selectedFile && (
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-red-600" />
                <div>
                  <p className="text-sm font-medium">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                </div>
              </div>
              {!uploading && (
                <Button variant="ghost" size="sm" onClick={handleRemoveFile} className="h-8 w-8 p-0">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}

          {/* Document Visibility */}
          <div className="space-y-2">
            <Label htmlFor="privacy">{t("pages:pdfUpload.docVisibility")}</Label>
            <RadioGroup
              defaultValue="private"
              onValueChange={(value: "private" | "public") => setPrivacySetting(value)}
              className="flex space-x-4"
              id="privacy"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="private" id="private" />
                <Label htmlFor="private">{t("pages:pdfUpload.private")}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="public" id="public" />
                <Label htmlFor="public">{t("pages:pdfUpload.public")}</Label>
              </div>
            </RadioGroup>
            <p className="text-xs text-muted-foreground">
              {t("pages:pdfUpload.privacyHelp")}
            </p>
          </div>

          {/* Multi-select for Allowed Users If Public */}
          {privacySetting === "public" && (
            <div className="space-y-2">
              <Label htmlFor="allowed-users">{t("pages:pdfUpload.selectUsersLabel")}</Label>
              <MultiSelect
                options={userOptions}
                value={allowedUsers}
                onChange={setAllowedUsers}
                placeholder={t("pages:pdfUpload.selectUsersPlaceholder")}
                id="allowed-users"
                disabled={uploading}
              />
              <p className="text-xs text-muted-foreground">
                {t("pages:pdfUpload.selectUsersHelp")}
              </p>
            </div>
          )}

          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-2">
              <Progress value={uploadProgress} className="w-full" />
              <p className="text-xs text-center text-muted-foreground">
                {t("pages:pdfUpload.uploadingProgress", { progress: uploadProgress })}
              </p>
            </div>
          )}

          {/* Upload Button */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={uploading}>
              {t("pages:pdfUpload.cancel")}
            </Button>
            <Button onClick={handleUpload} disabled={!selectedFile || uploading}>
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("pages:pdfUpload.uploading")}
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  {t("pages:pdfUpload.uploadPDF")}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
