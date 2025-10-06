import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

export const authOptions: NextAuthOptions = {
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
    async authorize(credentials) {
      console.log("Authorize function called with credentials:", credentials);

      if (!credentials?.email || !credentials?.password) {
        console.log("Missing email or password in credentials.");
        return null;
      }

      try {
        console.log("Sending login request to API...");
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
        });

        console.log("Received response from API:", response);
        const user = await response.json();
        console.log("Parsed user data:", user);

        if (response.ok && user) {
        console.log("Login successful, returning user.");
        return {...user.data.userData,token:user.data.token};
        }
        return null;
      } catch (error) {
        console.error("Error during login request:", error);
        return null;
      }
    }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
        console.log("JWT callback called with token:", token, "and user:", user);
      if (user) {
        token.id = user.id
        token.email = user.email
      }
      return {...token,...user};
    },
    async session({ session, token }) {
        console.log("Session callback called with session:", session, "and token:", token);
      if (token) {
        session.user=token;
      }
      return session
    },
  }
}