/**
 * QR Code Generation Utility
 * Generates QR codes for posts and blogs with spatial metadata
 */

export interface QRCodeOptions {
  size?: number
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
  margin?: number
  color?: {
    dark?: string
    light?: string
  }
}

/**
 * Generate QR code for a given URL using QR Server API
 */
export async function generateQRCode(
  url: string, 
  options: QRCodeOptions = {}
): Promise<string> {
  const {
    size = 200,
    errorCorrectionLevel = 'M',
    margin = 1,
    color = { dark: '000000', light: 'ffffff' }
  } = options

  try {
    // Using QR Server API (free service)
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?` +
      `size=${size}x${size}&` +
      `ecc=${errorCorrectionLevel}&` +
      `margin=${margin}&` +
      `color=${color.dark}&` +
      `bgcolor=${color.light}&` +
      `data=${encodeURIComponent(url)}`

    return qrUrl
  } catch (error) {
    console.error('Error generating QR code:', error)
    throw new Error('Failed to generate QR code')
  }
}

/**
 * Generate QR code as base64 data URL (for offline use)
 */
export async function generateQRCodeBase64(
  url: string,
  options: QRCodeOptions = {}
): Promise<string> {
  try {
    const qrUrl = await generateQRCode(url, options)
    
    // Fetch the image and convert to base64
    const response = await fetch(qrUrl)
    if (!response.ok) {
      throw new Error('Failed to fetch QR code image')
    }
    
    const blob = await response.blob()
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.error('Error generating base64 QR code:', error)
    throw new Error('Failed to generate base64 QR code')
  }
}

/**
 * Download QR code as image file
 */
export async function downloadQRCode(
  url: string,
  filename: string = 'qr-code.png',
  options: QRCodeOptions = {}
): Promise<void> {
  try {
    const qrUrl = await generateQRCode(url, { ...options, size: 512 })
    
    const response = await fetch(qrUrl)
    if (!response.ok) {
      throw new Error('Failed to fetch QR code image')
    }
    
    const blob = await response.blob()
    const downloadUrl = window.URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    window.URL.revokeObjectURL(downloadUrl)
  } catch (error) {
    console.error('Error downloading QR code:', error)
    throw new Error('Failed to download QR code')
  }
}

/**
 * Validate URL before QR code generation
 */
export function validateUrlForQR(url: string): boolean {
  try {
    new URL(url)
    return url.length <= 2048 // QR code URL length limit
  } catch {
    return false
  }
}

/**
 * Generate QR code with custom branding/styling
 */
export async function generateBrandedQRCode(
  url: string,
  brandOptions: {
    logo?: string
    brandColor?: string
    title?: string
  } = {}
): Promise<string> {
  const { brandColor = '1f2937' } = brandOptions
  
  return generateQRCode(url, {
    size: 300,
    errorCorrectionLevel: 'H', // High error correction for logo overlay
    color: {
      dark: brandColor,
      light: 'ffffff'
    }
  })
}
