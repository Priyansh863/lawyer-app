export interface FileMetadata {
  id: string
  fileName: string
  fileSize: number
  fileType: string
  description?: string
  uploadedAt: string
  uploadedBy: string
  clientId?: string
  caseId?: string
  storageLocation: "s3" | "local"
  encryptionType?: string
  url: string
}

// Schema for file upload
export const fileSchema = {
  file: {
    label: "File",
    type: "file",
    required: true,
    validation: {
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: [".pdf", ".doc", ".docx", ".jpg", ".png", ".txt"],
    },
  },
  description: {
    label: "Description",
    type: "textarea",
    required: false,
    validation: {
      maxLength: 500,
    },
  },
  storageLocation: {
    label: "Storage Location",
    type: "select",
    required: true,
    options: [
      { value: "s3", label: "AWS S3 (Encrypted)" },
      { value: "local", label: "Local Storage" },
    ],
    defaultValue: "s3",
  },
  caseId: {
    label: "Case",
    type: "select",
    required: false,
    options: "api:cases", // This would be populated from an API
  },
  clientId: {
    label: "Client",
    type: "select",
    required: false,
    options: "api:clients", // This would be populated from an API
  },
}

// Field mapping for API requests
export const fileApiMapping = {
  upload: {
    file: "file",
    description: "description",
    storageLocation: "storage_location",
    caseId: "case_id",
    clientId: "client_id",
  },
}
