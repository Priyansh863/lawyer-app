"use client"

import { Button } from "@/components/ui/button"
import { Share, Copy, Download } from "lucide-react"
import Image from "next/image"
import type { GeneratedContent } from "@/types/marketing"

interface ContentDisplayProps {
  content: GeneratedContent
  onShare: () => Promise<void>
  onCopyLink: () => void
  onBack: () => void
}

export default function ContentDisplay({ content, onShare, onCopyLink, onBack }: ContentDisplayProps) {
  const handleDownload = () => {
    // Create a temporary anchor element
    const link = document.createElement("a")
    link.href = content.imageUrl
    link.download = `marketing-content-${content.id}.jpg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Generated Content</h3>
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
      </div>

      <div className="flex flex-col items-center">
        <div className="relative w-full max-w-md h-80 mb-4">
          <Image src={content.imageUrl || "/placeholder.svg"} alt="Generated content" fill className="object-contain" />
        </div>

        <div className="w-full max-w-md text-sm text-gray-700 mb-4">
          <p>{content.caption}</p>
        </div>

        <div className="flex flex-wrap gap-2 w-full max-w-md">
          <Button onClick={onShare} className="flex-1">
            <Share className="h-4 w-4 mr-2" />
            Share this Image
          </Button>

          <Button variant="outline" onClick={onCopyLink} className="flex-1">
            <Copy className="h-4 w-4 mr-2" />
            Copy Link
          </Button>

          <Button variant="outline" onClick={handleDownload} className="flex-1">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </div>
    </div>
  )
}
