import { uploadFileOnS3 } from './fileupload';

/**
 * Upload file to S3 using presigned URL (for secure upload)
 */
export const uploadFileToS3ForSecureLink = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> => {
  try {
    // Create file path with timestamp for secure uploads
    const timestamp = new Date().getTime();
    const filePath = `secure-uploads/${timestamp}-${file.name}`;

    // Simulate progress updates during upload
    let progressInterval: NodeJS.Timeout | null = null;
    if (onProgress) {
      let currentProgress = 0;
      progressInterval = setInterval(() => {
        currentProgress += 10;
        if (currentProgress <= 90) {
          onProgress(currentProgress);
        }
      }, 100);
    }

    // Upload to S3 using existing utility
    const fileUrl = await uploadFileOnS3(file, filePath);
    
    // Complete progress
    if (progressInterval) {
      clearInterval(progressInterval);
    }
    if (onProgress) {
      onProgress(100);
    }

    if (!fileUrl) {
      throw new Error('Failed to upload file to S3');
    }

    return fileUrl;
  } catch (error) {
    console.error('Error uploading file to S3:', error);
    throw error;
  }
};

/**
 * Validate file for secure upload
 */
export const validateSecureUploadFile = (file: File): { valid: boolean; error?: string } => {
  // Check file size (10MB limit)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File size must be less than 10MB'
    };
  }

  // Check file type
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Only PDF, Word documents, and image files are allowed'
    };
  }

  return { valid: true };
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
