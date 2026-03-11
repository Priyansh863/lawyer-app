"use client"

import type React from "react"
import ClientLayout from "@/components/layouts/client-layout"

interface PostsLayoutProps {
  children: React.ReactNode
}

export default function PostsLayout({ children }: PostsLayoutProps) {
  return (
    <ClientLayout>
      {children}
    </ClientLayout>
  )
}
