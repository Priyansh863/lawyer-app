import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

// Get auth token from localStorage (with SSR safety)
const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null
  
  try {
    const user = localStorage.getItem('user')
    return user ? JSON.parse(user).token : null
  } catch (error) {
    console.error('Error getting auth token:', error)
    return null
  }
}

// Token validation response interface
export interface TokenValidationResponse {
  success: boolean
  message: string
  data: {
    expired: boolean
    isExpired: boolean
    userId?: string
    expiresAt?: string
    timeUntilExpiry?: number
    issuedAt?: string
    expiredAt?: string
    error?: string
  }
}

/**
 * Validate if a JWT token is expired or not
 * @param token - JWT token to validate (optional, uses stored token if not provided)
 * @param tone - Response tone ('friendly' or 'default')
 * @returns Promise<TokenValidationResponse>
 */
export const validateToken = async (
  token?: string, 
  tone: 'friendly' | 'default' = 'default'
): Promise<TokenValidationResponse> => {
  // Use provided token or get from localStorage
  const authToken = token || getAuthToken()
  
  if (!authToken) {
    return {
      success: false,
      message: tone === 'friendly' ? 'No session found. Please log in!' : 'No token provided',
      data: {
        expired: true,
        isExpired: true,
        error: 'No token available'
      }
    }
  }

  try {
    const response = await axios.post(
      `${API_BASE_URL}/auth/validate-token`,
      { 
        token: authToken,
        tone 
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )

    return response.data
  } catch (error: any) {
    console.error('Token validation error:', error)
    
    // Handle different error scenarios
    if (error.response?.status === 400) {
      return {
        success: false,
        message: tone === 'friendly' ? 'Invalid session format!' : 'Invalid token format',
        data: {
          expired: true,
          isExpired: true,
          error: error.response.data?.message || 'Bad request'
        }
      }
    }
    
    return {
      success: false,
      message: tone === 'friendly' ? 'Unable to check session. Please try again!' : 'Token validation failed',
      data: {
        expired: true,
        isExpired: true,
        error: error.response?.data?.message || error.message || 'Network error'
      }
    }
  }
}

/**
 * Check if current user's token is still valid
 * Convenience function that uses stored token
 * @param tone - Response tone ('friendly' or 'default')
 * @returns Promise<boolean> - true if token is valid, false if expired/invalid
 */
export const isTokenValid = async (tone: 'friendly' | 'default' = 'default'): Promise<boolean> => {
  try {
    const result = await validateToken(undefined, tone)
    return result.success && !result.data.isExpired
  } catch (error) {
    console.error('Error checking token validity:', error)
    return false
  }
}

/**
 * Get token expiration info
 * @param token - JWT token to check (optional, uses stored token if not provided)
 * @returns Promise<{ isExpired: boolean, expiresAt?: string, timeUntilExpiry?: number }>
 */
export const getTokenExpirationInfo = async (token?: string) => {
  try {
    const result = await validateToken(token, 'default')
    return {
      isExpired: result.data.isExpired,
      expiresAt: result.data.expiresAt,
      timeUntilExpiry: result.data.timeUntilExpiry,
      userId: result.data.userId
    }
  } catch (error) {
    console.error('Error getting token expiration info:', error)
    return {
      isExpired: true,
      expiresAt: undefined,
      timeUntilExpiry: undefined,
      userId: undefined
    }
  }
}

export default {
  validateToken,
  isTokenValid,
  getTokenExpirationInfo
}
