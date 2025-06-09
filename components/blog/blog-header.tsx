"use client"

import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { useRouter } from "next/navigation"

export default function BlogHeader() {
  const router = useRouter()

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold">Blog</h1>
        <p className="text-sm text-gray-500">Manage your legal blog content</p>
      </div>
      <Button onClick={() => router.push("/blog/new")} className="flex items-center gap-2">
        <PlusCircle size={16} />
        <span>New Post</span>
      </Button>
    </div>
  )
}
