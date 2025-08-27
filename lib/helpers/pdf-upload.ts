import { uploadFileOnS3 } from './fileupload'

/**
 * Upload PDF file to S3 using presigned URL
 * @param file - PDF file to upload
 * @param userId - User ID for file path
 * @returns Promise<string | undefined> - File URL after upload
 */
export const uploadPDFToS3 = async (
  file: File,
  userId: string
): Promise<string | undefined> => {
  // Validate file type


  // Validate file size (max 10MB)
  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
    throw new Error('File size must be less than 10MB')
  }

  // Create file path with timestamp and user ID
  const timestamp = new Date().getTime()
  const filePath = `ai-lawyer-documents/${timestamp}-${userId}-${file.name}`

  try {
    // Upload to S3 using existing utility
    const fileUrl = await uploadFileOnS3(file, filePath)
    return fileUrl
  } catch (error) {
    console.error('PDF upload error:', error)
    throw new Error('Failed to upload PDF file')
  }
}

/**
 * Validate PDF file before upload
 * @param file - File to validate
 * @returns boolean - True if valid PDF
 */
export const validatePDFFile = (file: File): { isValid: boolean; error?: string } => {
  // Check file type
 
  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
    return { isValid: false, error: 'File size must be less than 10MB' }
  }

  // Check file name
  if (!file.name.toLowerCase().endsWith('.pdf')) {
    return { isValid: false, error: 'File must have .pdf extension' }
  }

  return { isValid: true }
}
