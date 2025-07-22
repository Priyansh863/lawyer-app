import axios, { AxiosResponse, AxiosError } from 'axios'
import { validateToken } from '@/lib/api/auth-api'

// Track if we're already validating to prevent infinite loops
let isValidating = false

/**
 * Get token from localStorage (same pattern as existing codebase)
 */
const getToken = () => {
  if (typeof window === 'undefined') return null
  try {
    const user = localStorage.getItem('user')
    return user ? JSON.parse(user).token : null
  } catch (error) {
    console.error('Error getting token:', error)
    return null
  }
}

/**
 * Handle token expiration and logout
 */
const handleTokenExpiration = () => {
  // Clear localStorage
  if (typeof window !== 'undefined') {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    // Redirect to login page
    window.location.href = '/login'
  }
}

/**
 * Validate token after API calls
 */
const validateTokenAfterApiCall = async () => {
  if (isValidating) return
  
  isValidating = true
  
  try {
    const token = getToken()
    
    if (!token) {
      isValidating = false
      return
    }
    
    const result = await validateToken(token, 'default')
    
    if (!result.success || result.data.isExpired) {
      console.warn('Token expired during API call:', result.message)
      handleTokenExpiration()
    }
  } catch (error) {
    console.error('Token validation error after API call:', error)
    // Don't logout on validation errors, just log them
  } finally {
    isValidating = false
  }
}

/**
 * Setup Axios interceptors for automatic token validation
 */
export const setupTokenInterceptors = () => {
  // Request interceptor - add auth header
  axios.interceptors.request.use(
    (config) => {
      const token = getToken()
      
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`
      }
      
      return config
    },
    (error) => {
      return Promise.reject(error)
    }
  )

  // Response interceptor - validate token after successful calls
  axios.interceptors.response.use(
    (response: AxiosResponse) => {
      // Validate token after successful API calls (but not for token validation itself)
      if (!response.config.url?.includes('/validate-token')) {
        // Use setTimeout to avoid blocking the response
        setTimeout(() => {
          validateTokenAfterApiCall()
        }, 100)
      }
      
      return response
    },
    (error: AxiosError) => {
      // Handle specific auth errors
      if (error.response?.status === 401) {
        console.warn('Unauthorized API call, token may be expired')
        handleTokenExpiration()
      } else if (error.response?.status === 403) {
        console.warn('Forbidden API call, token may be invalid')
        // Validate token to check if it's expired
        setTimeout(() => {
          validateTokenAfterApiCall()
        }, 100)
      }
      
      return Promise.reject(error)
    }
  )
}

/**
 * Remove token interceptors (useful for cleanup)
 */
export const removeTokenInterceptors = () => {
  axios.interceptors.request.clear()
  axios.interceptors.response.clear()
}

export default {
  setupTokenInterceptors,
  removeTokenInterceptors,
  validateTokenAfterApiCall
}
