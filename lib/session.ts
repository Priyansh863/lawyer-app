// Simple session management utility for authentication
interface Session {
  token?: string;
  user?: {
    id: string;
    account_type: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

// Get session data from localStorage (client-side only)
export async function getSession(): Promise<Session | null> {
  if (typeof window === "undefined") {
    return null; // Server-side check
  }

  // Try to get the session data from localStorage
  try {
    const sessionData = localStorage.getItem("session");
    if (!sessionData) {
      return null;
    }
    return JSON.parse(sessionData) as Session;
  } catch (error) {
    console.error("Error retrieving session:", error);
    return null;
  }
}

// Save session data to localStorage (client-side only)
export async function setSession(session: Session): Promise<void> {
  if (typeof window === "undefined") {
    return; // Server-side check
  }

  try {
    localStorage.setItem("session", JSON.stringify(session));
  } catch (error) {
    console.error("Error saving session:", error);
  }
}

// Clear session data from localStorage (client-side only)
export async function clearSession(): Promise<void> {
  if (typeof window === "undefined") {
    return; // Server-side check
  }

  try {
    localStorage.removeItem("session");
  } catch (error) {
    console.error("Error clearing session:", error);
  }
}

// Check if a user is authenticated
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return !!(session?.token && session?.user);
}
