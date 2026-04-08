import type React from "react"
import type { Metadata } from "next"
import { DM_Sans } from "next/font/google"
import "./globals.css"
import ReduxProvider from "@/lib/redux-provider"
import TokenValidationProvider from "@/components/providers/TokenValidationProvider"
import { I18nProvider } from "@/contexts/i18nContext"
import { Toaster as HotToaster } from 'react-hot-toast';
import { NotificationProvider } from "@/contexts/NotificationContext"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster as SonnerToaster } from "@/components/ui/sonner"
import { Toaster as ShadcnToaster } from "@/components/ui/toaster"
import NotificationToastProvider from "@/components/providers/NotificationToastProvider"
// import { SessionProvider } from "next-auth/react"

// Initialize the DM Sans font
const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-dm-sans",
  display: "swap",
})

export const metadata: Metadata = {

}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className={`${dmSans.variable} font-dm-sans`}>
        <ReduxProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <I18nProvider>
              <TokenValidationProvider>
                <NotificationProvider>
                  <NotificationToastProvider />
                  {children}
                  <SonnerToaster position="bottom-right" />
                </NotificationProvider>
              </TokenValidationProvider>
            </I18nProvider>
          </ThemeProvider>
          <HotToaster
            position="bottom-right"
            containerStyle={{ zIndex: 1200 }}
            toastOptions={{ style: { zIndex: 1200 } }}
          />
          <ShadcnToaster />
        </ReduxProvider>
      </body>
    </html>
  )
}