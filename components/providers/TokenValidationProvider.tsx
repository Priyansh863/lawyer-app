'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { setupTokenInterceptors, removeTokenInterceptors } from '@/lib/interceptors/tokenInterceptor'
import { useRouteTokenValidation } from '@/hooks/useTokenValidation'

interface TokenValidationProviderProps {
  children: React.ReactNode
}

/**
 * Provider component that handles automatic token validation
 * - Sets up Axios interceptors for API call validation
 * - Validates tokens on route changes
 * - Manages token expiration handling
 */
export const TokenValidationProvider: React.FC<TokenValidationProviderProps> = ({ children }) => {
  const pathname = usePathname()
  const { validateCurrentToken, isLoggedIn } = useRouteTokenValidation()

  // Setup interceptors on mount
  useEffect(() => {
    setupTokenInterceptors()
    
    // Cleanup on unmount
    return () => {
      removeTokenInterceptors()
    }
  }, [])

  // Validate token on route changes
  useEffect(() => {
    // Skip validation for public routes
    const publicRoutes = ['/login', '/signup', '/forgot-password', '/verify-otp', '/']
    const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
    
    if (!isPublicRoute && isLoggedIn) {
      // Small delay to ensure route transition is complete
      const timeoutId = setTimeout(() => {
        validateCurrentToken(false)
      }, 500)
      
      return () => clearTimeout(timeoutId)
    }
  }, [pathname, isLoggedIn, validateCurrentToken])

  return <>{children}</>
}

export default TokenValidationProvider
