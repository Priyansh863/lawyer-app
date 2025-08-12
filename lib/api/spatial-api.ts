import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'

const getAuthHeaders = () => {
  const token = localStorage.getItem('token')
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
}

export interface SpatialInfo {
  planet?: string
  latitude?: number
  longitude?: number
  altitude?: number
  timestamp?: string
  floor?: number
}

export interface Citation {
  type: 'spatial' | 'user' | 'url'
  content: string
  spatialInfo?: SpatialInfo
  userId?: string
  url?: string
}

export interface BlogWithSpatial {
  _id: string
  title: string
  content: string
  author: any
  category: string
  status: 'draft' | 'published'
  slug: string
  spatialInfo?: SpatialInfo
  citations: Citation[]
  hashtag?: string
  customUrl?: string
  shortUrl?: string
  qrCodeUrl?: string
  createdAt: string
  updatedAt: string
}

export interface PostWithSpatial {
  _id: string
  title: string
  content: string
  author: any
  slug: string
  spatialInfo?: SpatialInfo
  citations: Citation[]
  hashtag?: string
  customUrl?: string
  shortUrl?: string
  qrCodeUrl?: string
  status: 'draft' | 'published'
  createdAt: string
  updatedAt: string
}

/**
 * Create blog with spatial metadata
 */
export async function createBlogWithSpatial(blogData: {
  title: string
  content: string
  category: string
  status?: 'draft' | 'published'
  spatialInfo?: SpatialInfo
  citations?: Citation[]
  hashtag?: string
}): Promise<BlogWithSpatial> {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/blog`,
      blogData,
      {
        headers: getAuthHeaders(),
      }
    )

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to create blog')
    }

    return response.data.data
  } catch (error) {
    console.error('Error creating blog with spatial data:', error)
    throw error
  }
}

/**
 * Create post with spatial metadata
 */
export async function createPostWithSpatial(postData: {
  title: string
  content: string
  status?: 'draft' | 'published'
  spatialInfo?: SpatialInfo
  citations?: Citation[]
  hashtag?: string
}): Promise<PostWithSpatial> {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/post`,
      postData,
      {
        headers: getAuthHeaders(),
      }
    )

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to create post')
    }

    return response.data.data
  } catch (error) {
    console.error('Error creating post with spatial data:', error)
    throw error
  }
}

/**
 * Update blog with spatial metadata
 */
export async function updateBlogWithSpatial(
  blogId: string,
  updates: Partial<BlogWithSpatial>
): Promise<BlogWithSpatial> {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/blog/${blogId}`,
      updates,
      {
        headers: getAuthHeaders(),
      }
    )

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to update blog')
    }

    return response.data.data
  } catch (error) {
    console.error('Error updating blog with spatial data:', error)
    throw error
  }
}

/**
 * Update post with spatial metadata
 */
export async function updatePostWithSpatial(
  postId: string,
  updates: Partial<PostWithSpatial>
): Promise<PostWithSpatial> {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/post/${postId}`,
      updates,
      {
        headers: getAuthHeaders(),
      }
    )

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to update post')
    }

    return response.data.data
  } catch (error) {
    console.error('Error updating post with spatial data:', error)
    throw error
  }
}

/**
 * Get blog by ID with spatial metadata
 */
export async function getBlogWithSpatial(blogId: string): Promise<BlogWithSpatial> {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/blog/${blogId}`,
      {
        headers: getAuthHeaders(),
      }
    )

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch blog')
    }

    return response.data.data
  } catch (error) {
    console.error('Error fetching blog with spatial data:', error)
    throw error
  }
}

/**
 * Get post by ID with spatial metadata
 */
export async function getPostWithSpatial(postId: string): Promise<PostWithSpatial> {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/post/${postId}`,
      {
        headers: getAuthHeaders(),
      }
    )

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch post')
    }

    return response.data.data
  } catch (error) {
    console.error('Error fetching post with spatial data:', error)
    throw error
  }
}

/**
 * Parse location URL to extract spatial information
 */
export function parseLocationUrl(url: string): SpatialInfo | null {
  try {
    const urlObj = new URL(url)
    const params = urlObj.searchParams
    
    // Check if it's a short URL format
    if (urlObj.pathname.startsWith('/l/')) {
      const queryString = urlObj.search.slice(1)
      if (queryString && !queryString.includes('=')) {
        const parts = queryString.split(',')
        if (parts.length >= 3) {
          return {
            planet: parts[0] || undefined,
            latitude: parts[1] ? parseFloat(parts[1]) : undefined,
            longitude: parts[2] ? parseFloat(parts[2]) : undefined,
            altitude: parts[3] ? parseFloat(parts[3]) : undefined,
            timestamp: parts[4] || undefined,
            floor: parts[5] ? parseInt(parts[5]) : undefined
          }
        }
      }
    }
    
    // Parse full URL format
    const spatialInfo: SpatialInfo = {}
    if (params.get('planet')) spatialInfo.planet = params.get('planet')!
    if (params.get('lat')) spatialInfo.latitude = parseFloat(params.get('lat')!)
    if (params.get('lng')) spatialInfo.longitude = parseFloat(params.get('lng')!)
    if (params.get('altitude')) spatialInfo.altitude = parseFloat(params.get('altitude')!)
    if (params.get('timestamp')) spatialInfo.timestamp = params.get('timestamp')!
    if (params.get('floor')) spatialInfo.floor = parseInt(params.get('floor')!)
    
    return Object.keys(spatialInfo).length > 0 ? spatialInfo : null
  } catch (error) {
    console.error('Error parsing location URL:', error)
    return null
  }
}

/**
 * Generate custom URL with spatial metadata
 */
export function generateCustomUrl(
  type: 'blog' | 'post',
  slug: string,
  spatialInfo?: SpatialInfo
): string {
  const baseUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://yourapp.com'
  
  if (!spatialInfo || (!spatialInfo.latitude && !spatialInfo.longitude)) {
    return `${baseUrl}/${type}/${slug}`
  }
  
  const params = new URLSearchParams()
  if (spatialInfo.planet) params.append('planet', spatialInfo.planet)
  if (spatialInfo.latitude) params.append('lat', spatialInfo.latitude.toString())
  if (spatialInfo.longitude) params.append('lng', spatialInfo.longitude.toString())
  if (spatialInfo.altitude) params.append('altitude', spatialInfo.altitude.toString())
  if (spatialInfo.timestamp) params.append('timestamp', spatialInfo.timestamp)
  if (spatialInfo.floor) params.append('floor', spatialInfo.floor.toString())
  
  return `${baseUrl}/${type}/${slug}?${params.toString()}`
}

/**
 * Generate short URL with spatial metadata
 */
export function generateShortUrl(
  type: 'blog' | 'post',
  slug: string,
  spatialInfo?: SpatialInfo
): string {
  const baseUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://yourapp.com'
  
  if (!spatialInfo || (!spatialInfo.latitude && !spatialInfo.longitude)) {
    return `${baseUrl}/l/${type}/${slug}`
  }
  
  const parts = [
    spatialInfo.planet || '',
    spatialInfo.latitude || '',
    spatialInfo.longitude || '',
    spatialInfo.altitude || '',
    spatialInfo.timestamp || '',
    spatialInfo.floor || ''
  ]
  
  return `${baseUrl}/l/${type}/${slug}?${parts.join(',')}`
}

/**
 * Validate spatial information
 */
export function validateSpatialInfo(spatialInfo: SpatialInfo): string[] {
  const errors: string[] = []
  
  if (spatialInfo.latitude !== undefined) {
    if (spatialInfo.latitude < -90 || spatialInfo.latitude > 90) {
      errors.push('Latitude must be between -90 and 90 degrees')
    }
    const decimalPlaces = (spatialInfo.latitude.toString().split('.')[1] || '').length
    if (decimalPlaces < 5 || decimalPlaces > 7) {
      errors.push('Latitude must have 5-7 decimal places')
    }
  }
  
  if (spatialInfo.longitude !== undefined) {
    if (spatialInfo.longitude < -180 || spatialInfo.longitude > 180) {
      errors.push('Longitude must be between -180 and 180 degrees')
    }
    const decimalPlaces = (spatialInfo.longitude.toString().split('.')[1] || '').length
    if (decimalPlaces < 5 || decimalPlaces > 7) {
      errors.push('Longitude must have 5-7 decimal places')
    }
  }
  
  if (spatialInfo.altitude !== undefined) {
    if (spatialInfo.altitude < -500 || spatialInfo.altitude > 9000) {
      errors.push('Altitude must be between -500 and 9000 meters')
    }
  }
  
  if (spatialInfo.floor !== undefined) {
    if (!Number.isInteger(spatialInfo.floor)) {
      errors.push('Floor must be an integer')
    }
  }
  
  if (spatialInfo.timestamp) {
    try {
      new Date(spatialInfo.timestamp)
    } catch {
      errors.push('Invalid timestamp format')
    }
  }
  
  return errors
}

/**
 * Validate citation
 */
export function validateCitation(citation: Citation): string[] {
  const errors: string[] = []
  
  if (!citation.content || citation.content.trim().length === 0) {
    errors.push('Citation content is required')
  }
  
  if (citation.content && citation.content.length > 500) {
    errors.push('Citation content must be 500 characters or less')
  }
  
  if (citation.type === 'url' && citation.url) {
    try {
      new URL(citation.url)
    } catch {
      errors.push('Invalid URL format')
    }
  }
  
  if (citation.type === 'user' && citation.userId) {
    if (!/^[a-zA-Z0-9_]+$/.test(citation.userId)) {
      errors.push('User ID can only contain letters, numbers, and underscores')
    }
  }
  
  return errors
}
