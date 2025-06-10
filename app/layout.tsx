import type React from "react"
import type { Metadata } from "next"
import { Lato } from "next/font/google"
import "./globals.css"
import ReduxProvider from "@/lib/redux-provider"
// import { SessionProvider } from "next-auth/react"

// Initialize the Lato font
const lato = Lato({
  subsets: ["latin"],
  weight: ["100", "300", "400", "700", "900"],
  variable: "--font-lato",
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
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className={`${lato.variable} font-lato`}>
          <ReduxProvider>
            {children}
          </ReduxProvider>
      </body>
    </html>
  )
}