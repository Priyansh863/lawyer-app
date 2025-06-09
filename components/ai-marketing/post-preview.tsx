"use client"

import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"
import type { LegalPost } from "@/types/marketing"
import { formatDate } from "@/lib/utils"

interface PostPreviewProps {
  post: LegalPost
}

export default function PostPreview({ post }: PostPreviewProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="space-y-4">
          {post.imageUrl && (
            <div className="relative w-full h-64">
              <Image
                src={post.imageUrl || "/placeholder.svg"}
                alt="Post image"
                fill
                className="object-cover rounded-md"
              />
            </div>
          )}

          <div>
            <h4 className="font-medium text-lg">{post.title}</h4>
            <p className="text-sm text-muted-foreground mb-2">Generated on {formatDate(post.createdAt)}</p>
            <div className="prose prose-sm max-w-none">
              <p>{post.content}</p>
            </div>

            {post.hashtags && post.hashtags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {post.hashtags.map((tag) => (
                  <span key={tag} className="text-sm text-blue-600 hover:underline">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
