export interface ProcessedFile {
  id: string
  fileName: string
  fileSize: number
  fileType: string
  extractedText: string
  summary?: string
  processingMethod: "OCR" | "ACR" | "TEXT" | "OTHER"
  uploadedAt: string
  uploadedBy: string
  url: string
}

export interface SecureLinkOptions {
  fileId?: string
  expiryDays: number
  password?: string
  maxDownloads?: number
}

export interface SecureLinkResult {
  url: string
  expiresAt: string
  isPasswordProtected: boolean
  maxDownloads?: number
}

// Schema for AI processing
export const aiProcessingSchema = {
  file: {
    label: "File",
    type: "file",
    required: true,
    validation: {
      maxSize: 50 * 1024 * 1024, // 50MB
      allowedTypes: [".pdf", ".txt", ".docx", ".xlsx", ".jpg", ".jpeg", ".png", ".mp3", ".mp4"],
    },
  },
  processingOptions: {
    label: "Processing Options",
    type: "multiselect",
    required: false,
    options: [
      { value: "ocr", label: "OCR (Image to Text)" },
      { value: "acr", label: "ACR (Audio to Text)" },
      { value: "summarize", label: "Auto-Summarize" },
    ],
  },
  caseId: {
    label: "Case",
    type: "select",
    required: false,
    options: "api:cases", // This would be populated from an API
  },
}

// Field mapping for API requests
export const aiProcessingApiMapping = {
  process: {
    file: "file",
    processingOptions: "processing_options",
    caseId: "case_id",
  },
  generateSummary: {
    fileId: "file_id",
    maxLength: "max_length",
    format: "format",
  },
  secureLink: {
    fileId: "file_id",
    expiryDays: "expiry_days",
    password: "password",
    maxDownloads: "max_downloads",
  },
}
