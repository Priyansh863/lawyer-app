import type { User } from "../types/user"

/**
 * Get the current authenticated user
 *  this would use NextAuth or similar
 */
export async function getCurrentUser(): Promise<User> {
  // Mock implementation
  return {
    id: "user_1",
    name: "Joseph",
    email: "joseph@example.com",
    role: "lawyer",
    avatar: "/placeholder.svg?height=32&width=32",
  }
}

/**
 * Check if the user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  // Mock implementation
  return true
}
