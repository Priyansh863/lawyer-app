import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/lib/store'
import { validateToken } from '@/lib/api/auth-api'
import { logout } from '@/lib/slices/authSlice'
import { toast } from '@/hooks/use-toast'

/**
 * Custom hook for automatic token validation
 * Validates token on route changes and provides manual validation
 */
export const useTokenValidation = () => {
  const router = useRouter()
  const dispatch = useDispatch()
  const user = useSelector((state: RootState) => state.auth.user)
  
  // Get token from localStorage (same pattern as existing codebase)
  const getStoredToken = useCallback(() => {
    if (typeof window === 'undefined') return null
    try {
      const userData = localStorage.getItem('user')
      return userData ? JSON.parse(userData).token : null
    } catch (error) {
      console.error('Error getting stored token:', error)
      return null
    }
  }, [])
  
  const token = getStoredToken()

  // Handle token expiration
  const handleTokenExpiration = useCallback((message?: string) => {
    // Clear Redux state
    dispatch(logout())
    
    // Show user-friendly message
    toast({
      title: "Session Expired",
      description: message || "Your session has expired. Please log in again.",
      variant: "destructive",
    })
    
    // Redirect to login page
    router.push('/login')
  }, [dispatch, router])

  // Validate current token
  const validateCurrentToken = useCallback(async (showToast = false) => {
    if (!token) {
      if (showToast) {
        handleTokenExpiration("No active session found.")
      }
      return false
    }

    try {
      const result = await validateToken(token, 'friendly')
      
      if (!result.success || result.data.isExpired) {
        handleTokenExpiration(result.message)
        return false
      }
      
      // Token is valid
      if (showToast) {
        toast({
          title: "Session Active",
          description: result.message,
          variant: "default",
        })
      }
      
      return true
    } catch (error) {
      console.error('Token validation error:', error)
      if (showToast) {
        handleTokenExpiration("Unable to verify session. Please log in again.")
      }
      return false
    }
  }, [token, handleTokenExpiration])

  // Validate token on route changes
  useEffect(() => {
    // Only validate if user is logged in
    if (user && token) {
      validateCurrentToken(false)
    }
  }, [user, token, validateCurrentToken])

  return {
    validateCurrentToken,
    handleTokenExpiration,
    isLoggedIn: !!user && !!token
  }
}

/**
 * Hook specifically for route-based token validation
 * Use this in layout components or pages that need automatic validation
 */
export const useRouteTokenValidation = () => {
  const { validateCurrentToken, isLoggedIn } = useTokenValidation()
  
  useEffect(() => {
    // Validate token on every route change if user is logged in
    if (isLoggedIn) {
      validateCurrentToken(false)
    }
  }, [validateCurrentToken, isLoggedIn])

  return { validateCurrentToken, isLoggedIn }
}
