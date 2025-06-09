"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { getPostHistory } from "@/lib/api/marketing-api"
import type { LegalPost, PostStatus } from "@/types/marketing"
import { formatDate } from "@/lib/utils"
import { Eye, Copy, BarChart, Loader2 } from "lucide-react"
import Image from "next/image"

export default function PostHistory() {
  const [posts, setPosts] = useState<LegalPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const loadHistory = async () => {
      setIsLoading(true)
      try {
        const history = await getPostHistory()
        setPosts(history)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load post history",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadHistory()
  }, [toast])

  const getStatusBadge = (status: PostStatus) => {
    switch (status) {
      case "published":
        return <Badge className="bg-green-500">Published</Badge>
      case "draft":
        return <Badge variant="outline">Draft</Badge>
      case "scheduled":
        return <Badge className="bg-blue-500">Scheduled</Badge>
      case "failed":
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Post History</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No posts found in your history</div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <Card key={post.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {post.imageUrl && (
                      <div className="relative w-20 h-20 flex-shrink-0">
                        <Image
                          src={post.imageUrl || "/placeholder.svg"}
                          alt="Post thumbnail"
                          fill
                          className="object-cover rounded-md"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium truncate">{post.title}</h3>
                        {getStatusBadge(post.status)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">{formatDate(post.createdAt)}</p>
                      <p className="text-sm text-muted-foreground mb-2 truncate">
                        {post.platforms.join(", ")}
                        {post.targetRegion && ` • ${post.targetRegion}`}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" className="h-8">
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          View
                        </Button>
                        <Button variant="outline" size="sm" className="h-8">
                          <Copy className="h-3.5 w-3.5 mr-1" />
                          Clone
                        </Button>
                        <Button variant="outline" size="sm" className="h-8">
                          <BarChart className="h-3.5 w-3.5 mr-1" />
                          Analytics
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
