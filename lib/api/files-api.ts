import type { FileMetadata } from "@/types/file"

interface UploadFileParams {
  file: File
  description?: string
  storageLocation: "s3" | "local"
  metadata?: Record<string, string>
  onProgress?: (progress: number) => void
}

/**
 * Upload a file to the specified storage location
 */
export async function uploadFile({
  file,
  description = "",
  storageLocation,
  metadata = {},
  onProgress,
}: UploadFileParams): Promise<FileMetadata> {
  // Simulate progress updates
  if (onProgress) {
    let progress = 0
    const interval = setInterval(() => {
      progress += 10
      if (progress > 90) {
        clearInterval(interval)
      }
      onProgress(progress)
    }, 300)
  }

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 2000))

  // Mock result
  const fileId = `file_${Date.now()}`
  const result: FileMetadata = {
    id: fileId,
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    description,
    uploadedAt: new Date().toISOString(),
    uploadedBy: "user_1", // Would come from auth context
    storageLocation,
    encryptionType: storageLocation === "s3" ? "AES256" : undefined,
    url: `https://example.com/files/${fileId}/${file.name}`,
    ...metadata,
  }

  return result
}

/**
 * Get files for a specific case
 */
export async function getCaseFiles(caseId: string): Promise<FileMetadata[]> {
  await new Promise((resolve) => setTimeout(resolve, 800))

  return [
    {
      id: "file_1",
      fileName: "contract.pdf",
      fileSize: 1024000,
      fileType: "application/pdf",
      description: "Original contract document",
      uploadedAt: "2025-03-22T14:30:00Z",
      uploadedBy: "user_1",
      caseId,
      storageLocation: "s3",
      encryptionType: "AES256",
      url: "https://example.com/files/file_1/contract.pdf",
    },
    {
      id: "file_2",
      fileName: "amendment.docx",
      fileSize: 512000,
      fileType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      description: "Contract amendment",
      uploadedAt: "2025-03-23T09:15:00Z",
      uploadedBy: "user_1",
      caseId,
      storageLocation: "s3",
      encryptionType: "AES256",
      url: "https://example.com/files/file_2/amendment.docx",
    },
    {
      id: "file_3",
      fileName: "signature.jpg",
      fileSize: 256000,
      fileType: "image/jpeg",
      description: "Client signature",
      uploadedAt: "2025-03-24T11:45:00Z",
      uploadedBy: "user_1",
      caseId,
      storageLocation: "s3",
      encryptionType: "AES256",
      url: "https://example.com/files/file_3/signature.jpg",
    },
  ]
}

/**
 * Get files for a specific client
 */
export async function getClientFiles(clientId: string): Promise<FileMetadata[]> {
  await new Promise((resolve) => setTimeout(resolve, 800))

  return [
    {
      id: "file_101",
      fileName: "client_intro.pdf",
      fileSize: 204800,
      fileType: "application/pdf",
      description: "Initial client brief",
      uploadedAt: "2025-04-15T10:00:00Z",
      uploadedBy: "user_1",
      clientId,
      storageLocation: "local",
      encryptionType: undefined,
      url: "https://example.com/files/file_101/client_intro.pdf",
    },
    {
      id: "file_102",
      fileName: "photo.png",
      fileSize: 102400,
      fileType: "image/png",
      description: "Client profile photo",
      uploadedAt: "2025-04-16T12:00:00Z",
      uploadedBy: "user_2",
      clientId,
      storageLocation: "s3",
      encryptionType: "AES256",
      url: "https://example.com/files/file_102/photo.png",
    },
  ]
}

/**
 * Delete a file
 */
export async function deleteFile(fileId: string): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 500))
  return true
}

/**
 * Download a file
 */
export async function downloadFile(fileId: string): Promise<Blob> {
  await new Promise((resolve) => setTimeout(resolve, 1000))
  const mockPdfContent = "Mock PDF content"
  return new Blob([mockPdfContent], { type: "application/pdf" })
}
