import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// TypeScript interfaces matching backend contract
export interface SpatialInfo {
  planet?: string
  latitude?: number
  longitude?: number
  altitude?: number
  timestamp?: string // ISO 8601 format
  floor?: number
}

export interface Citation {
  type: 'spatial' | 'user' | 'url'
  content: string
}

export interface Post {
  _id: string
  title: string
  content: string
  author: {
    _id: string
    name: string
    email: string
  }
  spatialInfo?: SpatialInfo
  citations?: Citation[]
  status: 'draft' | 'published'
  customUrl?: string
  shortUrl?: string
  qrCodeUrl?: string
  createdAt: string
  updatedAt: string
}

export interface CreatePostRequest {
  title: string
  content: string
  spatialInfo?: SpatialInfo
  citations?: Citation[]
  status: 'draft' | 'published'
}

// Get auth token from localStorage
const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    const user = localStorage.getItem('user')
    if (user) {
      const userData = JSON.parse(user)
      return userData.token
    }
  }
  return null
}

// Generate post content from prompt using backend AI
export const generatePost = async (prompt: string): Promise<{ content: string }> => {
  const token = getAuthToken()
  
  if (!token) {
    throw new Error('Authentication required')
  }

  try {
    const response = await axios.post(
      `${API_BASE_URL}/ai/generate-post`,
      { prompt },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    )

    // The new API returns { success, message, content }
    if (response.data.success) {
      return { content: response.data.content }
    } else {
      throw new Error(response.data.message || 'Failed to generate post content')
    }
  } catch (error: any) {
    console.error('Error generating post:', error)
    throw new Error(error.response?.data?.message || 'Failed to generate post content')
  }
}

// Create a new post with spatial metadata
export const createPost = async (postData: CreatePostRequest): Promise<Post> => {
  const token = getAuthToken()
  
  if (!token) {
    throw new Error('Authentication required')
  }

  try {
    const response = await axios.post(
      `${API_BASE_URL}/post/create`,
      postData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    )

    return response.data
  } catch (error: any) {
    console.error('Error creating post:', error)
    throw new Error(error.response?.data?.message || 'Failed to create post')
  }
}

// Generate QR code for a post
export const generateQRCode = async (slug: string): Promise<{ qrCodeUrl: string }> => {
  const token = getAuthToken()
  
  if (!token) {
    throw new Error('Authentication required')
  }

  try {
    const response = await axios.post(
      `${API_BASE_URL}/post/${slug}/qr-code`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    )

    return response.data
  } catch (error: any) {
    console.error('Error generating QR code:', error)
    throw new Error(error.response?.data?.message || 'Failed to generate QR code')
  }
}

// Utility functions for URL generation (client-side)
export const generateCustomUrl = (
  baseUrl: string,
  postTitle: string,
  spatialInfo?: SpatialInfo
): string => {
  const slug = postTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '')
  let url = `${baseUrl}/${slug}`

  if (spatialInfo && spatialInfo.latitude && spatialInfo.longitude) {
    const params = new URLSearchParams()
    
    if (spatialInfo.planet) params.append('planet', spatialInfo.planet)
    params.append('lat', spatialInfo.latitude.toString())
    params.append('lng', spatialInfo.longitude.toString())
    if (spatialInfo.altitude) params.append('altitude', spatialInfo.altitude.toString())
    if (spatialInfo.timestamp) params.append('timestamp', spatialInfo.timestamp)
    if (spatialInfo.floor) params.append('floor', spatialInfo.floor.toString())

    url += `?${params.toString()}`
  }

  return url
}

export const generateShortUrl = (
  baseUrl: string,
  postTitle: string,
  spatialInfo?: SpatialInfo
): string => {
  const slug = postTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '')
  let url = `${baseUrl}/l/${slug}`

  if (spatialInfo && spatialInfo.latitude && spatialInfo.longitude) {
    const parts = [
      spatialInfo.planet || 'Earth',
      spatialInfo.latitude.toString(),
      spatialInfo.longitude.toString(),
      spatialInfo.altitude?.toString() || '',
      spatialInfo.timestamp || '',
      spatialInfo.floor?.toString() || ''
    ]

    url += `?${parts.join(',')}`
  }

  return url
}

// Validation functions
export const validateCoordinates = (lat?: number, lng?: number): boolean => {
  if (lat === undefined || lng === undefined) return true // Optional fields
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
}

export const validateAltitude = (altitude?: number): boolean => {
  if (altitude === undefined) return true // Optional field
  return altitude >= -500 && altitude <= 9000
}

export const validateFloor = (floor?: number): boolean => {
  if (floor === undefined) return true // Optional field
  return Number.isInteger(floor)
}

export const validateTimestamp = (timestamp?: string): boolean => {
  if (!timestamp) return true // Optional field
  
  try {
    const date = new Date(timestamp)
    return !isNaN(date.getTime()) && timestamp.includes('T')
  } catch {
    return false
  }
}

export const validateSpatialInfo = (spatialInfo?: SpatialInfo): string[] => {
  const errors: string[] = []

  if (!spatialInfo) return errors

  if (!validateCoordinates(spatialInfo.latitude, spatialInfo.longitude)) {
    errors.push('Invalid coordinates. Latitude must be -90 to 90, longitude must be -180 to 180')
  }

  if (!validateAltitude(spatialInfo.altitude)) {
    errors.push('Invalid altitude. Must be between -500 and 9000 meters')
  }

  if (!validateFloor(spatialInfo.floor)) {
    errors.push('Invalid floor. Must be an integer (use negative for basement)')
  }

  if (!validateTimestamp(spatialInfo.timestamp)) {
    errors.push('Invalid timestamp. Must be in ISO 8601 format (e.g., 2025-04-27T11:30:00)')
  }

  return errors
}
