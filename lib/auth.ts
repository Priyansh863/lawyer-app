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
      if (!credentials?.email || !credentials?.password) {
        throw new Error("Please enter both email and password");
      }

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password
          }),
        });

        const data = await response.json();

        // Handle unverified account
        if (data?.message === 'account_not_verified') {
          throw new Error('account_not_verified');
        }

        // Handle invalid credentials
        if (response.status === 401 || data?.message === 'Invalid credentials' || data?.message === 'credentials_not_match') {
          throw new Error('Invalid email or password');
        }

        // Handle user not found
        if (data?.message === 'no_user_found') {
          throw new Error('No account found with this email');
        }

        // Handle inactive account
        if (data?.message === 'user_not_active') {
          throw new Error('This account has been deactivated');
        }

        // Handle successful login
        if (response.ok && data?.data?.userData) {
          return {
            ...data.data.userData,
            token: data.data.token
          };
        }

        // Handle any other error responses
        throw new Error(data?.message || 'Login failed. Please try again.');
      } catch (error) {
        // Instead of returning null, throw the error to show the actual error message
        if (error instanceof Error) {
          throw error;
        }
        throw new Error('Login failed. Please try again.');
      }
    }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
      }
      return {...token,...user};
    },
    async session({ session, token }) {
      if (token) {
        session.user=token;
      }
      return session
    },
  }
}
