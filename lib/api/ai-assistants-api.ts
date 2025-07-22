import axios from 'axios'
import { getUploadFileUrl, getUploadDocumentUrl } from '@/lib/helpers/fileupload'
import type { ProcessedFile, SecureLinkOptions, SecureLinkResult } from "@/types/ai-assistant"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'

// Helper function to get current user from localStorage
const getToken = () => {
  if (typeof window !== "undefined") {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user).token : null;
  }
  return null;
};

// Helper function to get auth headers
const getAuthHeaders = () => {
const token = getToken()
return {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
}

/**
 * Process a file for text extraction using backend API
 */
export async function processFile(file: File, userId: string): Promise<ProcessedFile | undefined> {
  try {

    // Step 1: Upload file to S3 using presigned URL
    const fileFormat = file.type.split("/")[1] || 'pdf'
    const fileData = await new Promise<{ data: string | ArrayBuffer | null, format: string }>((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        resolve({
          data: reader.result,
          format: fileFormat,
        })
      }
      reader.readAsDataURL(file)
    })

    // Use appropriate upload function based on file type
    let fileUrl: string
    if (file.type.startsWith('image/')) {
      fileUrl = await getUploadFileUrl(userId, fileData)
    } else {
      fileUrl = await getUploadDocumentUrl(userId, fileData)
    }
    
    if (!fileUrl) {
      throw new Error('Failed to upload file')
    }

    // Step 2: Call backend API to process the file
    const response = await axios.post(`${API_BASE_URL}/document/upload-with-summary`, {
      userId: userId,
      fileUrl: fileUrl,
      fileName: file.name,
    }, {
      headers: getAuthHeaders()
    })

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to process file')
    }

    // Determine processing method based on file type
    let processingMethod: "OCR" | "ACR" | "TEXT" | "OTHER" = "TEXT"
    if (file.type.startsWith("image/")) {
      processingMethod = "OCR"
    } else if (file.type.startsWith("audio/") || file.type.includes("mp3") || file.type.includes("mp4")) {
      processingMethod = "ACR"
    } else if (!file.type.includes("text") && !file.type.includes("pdf") && !file.type.includes("doc")) {
      processingMethod = "OTHER"
    }

    // Return processed file with real data from backend
    return {
      id: response.data.document._id,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      extractedText: response.data.summary || 'No summary available',
      processingMethod,
      uploadedAt: response.data.document.createdAt,
      uploadedBy: userId,
      url: fileUrl,
    }
  } catch (error: any) {
    if (error.message.includes('The file given is not an image')) {
      console.warn('File processing warning:', error)
    } else {
      console.error('File processing error:', error)
      throw new Error(error.message || 'Failed to process file')
    }
  }
}

/**
 * Generate a summary for a processed file using backend API
 */
export async function generateSummary(fileId: string): Promise<{ summary: string }> {
  try {
    const response = await axios.get(`${API_BASE_URL}/document/${fileId}/summary`, {
      headers: getAuthHeaders()
    })

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to generate summary')
    }

    return {
      summary: response.data.summary || 'No summary available'
    }
  } catch (error: any) {
    console.error('Summary generation error:', error)
    throw new Error(error.message || 'Failed to generate summary')
  }
}

/**
 * Download a summary from backend API
 */
export async function downloadSummary(fileId: string): Promise<void> {
  try {
    const response = await axios.get(`${API_BASE_URL}/document/${fileId}/download-summary`, {
      headers: getAuthHeaders(),
      responseType: 'blob'
    })

    // Create download link
    const blob = new Blob([response.data], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `summary-${fileId}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (error: any) {
    console.error('Summary download error:', error)
    throw new Error(error.message || 'Failed to download summary')
  }
}

/**
 * Save a summary to a case using backend API
 */
export async function saveToCase(fileId: string, caseId: string): Promise<void> {
  try {
    const response = await axios.post(`${API_BASE_URL}/document/${fileId}/save-to-case`, {
      caseId: caseId
    }, {
      headers: getAuthHeaders()
    })

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to save to case')
    }
  } catch (error: any) {
    console.error('Save to case error:', error)
    throw new Error(error.message || 'Failed to save summary to case')
  }
}

/**
 * Generate a secure link for file sharing using backend API
 */
export async function generateSecureLink(options: SecureLinkOptions): Promise<SecureLinkResult> {
  try {
    const response = await axios.post(`${API_BASE_URL}/document/generate-secure-link`, {
      fileId: options.fileId,
      expiryDays: options.expiryDays,
      password: options.password,
      maxDownloads: options.maxDownloads
    }, {
      headers: getAuthHeaders()
    })

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to generate secure link')
    }

    return {
      url: response.data.url,
      expiresAt: response.data.expiresAt,
      isPasswordProtected: Boolean(options.password),
      maxDownloads: options.maxDownloads,
    }
  } catch (error: any) {
    console.error('Secure link generation error:', error)
    throw new Error(error.message || 'Failed to generate secure link')
  }
}
