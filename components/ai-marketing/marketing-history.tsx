"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { getPostHistory } from "@/lib/api/marketing-api"
import Image from "next/image"
import { formatDate } from "@/lib/utils"
import type { LegalPost as GeneratedContent } from "@/types/marketing"
export default function MarketingHistory() {
  const [history, setHistory] = useState<GeneratedContent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const loadHistory = async () => {
      setIsLoading(true)
      try {
        const contentHistory = await getPostHistory()

        setHistory(contentHistory)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load content history",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadHistory()
  }, [toast])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Content History</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="social">Social Media</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="blog">Blog</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading history...</div>
            ) : history.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No content history found</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {history.map((content) => (
                  <Card key={content.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <div className="relative w-20 h-20 flex-shrink-0">
                          <Image
                            src={content.imageUrl || "/placeholder.svg"}
                            alt="Content thumbnail"
                            fill
                            className="object-cover rounded-md"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{content.prompt}</p>
                          <p className="text-sm text-gray-500 mb-2">{formatDate(content.createdAt)}</p>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="text-xs">
                              View
                            </Button>
                            <Button variant="outline" size="sm" className="text-xs">
                              Reuse
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Other tab contents would be similar but filtered by type */}
          <TabsContent value="social" className="space-y-4">
            <div className="text-center py-8 text-muted-foreground">Filter for social media content would go here</div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
