"use client"

import { useState } from "react"
import DashboardHeader from "@/components/dashboard/dashboard-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import {
  Send,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Upload,
  Video,
  ImageIcon,
  Wand2,
  Share2,
  Copy,
  QrCode,
  MapPin,
} from "lucide-react"
import LocationUrlGenerator from "@/components/ai-marketing/location-url-generator"

interface PlatformContent {
  [key: string]: {
    content?: string
    title?: string
    description?: string
    media?: File | null
  }
}

interface DeliveryStatus {
  platform: string
  status: "pending" | "success" | "failed"
  message?: string
}

export default function AIMarketingPage() {
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [platformContent, setPlatformContent] = useState<PlatformContent>({})
  const [generatedContent, setGeneratedContent] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [deliveryStatus, setDeliveryStatus] = useState<DeliveryStatus[]>([])
  const [prompt, setPrompt] = useState("")
  const [generatedUrls, setGeneratedUrls] = useState({ full: "", short: "" })
  const { toast } = useToast()

  const platforms = [
    {
      id: "linkedin",
      name: "LinkedIn",
      icon: "💼",
      color: "bg-blue-50 border-blue-200",
      requiresMedia: false,
      description: "Professional networking platform",
    },
    {
      id: "twitter",
      name: "Twitter/X",
      icon: "🐦",
      color: "bg-sky-50 border-sky-200",
      requiresMedia: false,
      description: "Microblogging platform (280 characters)",
    },
    {
      id: "facebook",
      name: "Facebook",
      icon: "📘",
      color: "bg-blue-50 border-blue-200",
      requiresMedia: false,
      description: "Social networking platform",
    },
    {
      id: "instagram",
      name: "Instagram",
      icon: "📷",
      color: "bg-pink-50 border-pink-200",
      requiresMedia: true,
      mediaType: "image",
      description: "Visual content platform (image required)",
    },
    {
      id: "youtube",
      name: "YouTube",
      icon: "📺",
      color: "bg-red-50 border-red-200",
      requiresMedia: true,
      mediaType: "video",
      description: "Video sharing platform (video required)",
    },
  ]

  const generateContent = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt to generate content",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    try {
      // Simulate AI content generation
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const generated = `🏛️ Legal Update: ${prompt}

Based on recent legal developments, here are key insights for legal professionals:

• Important regulatory changes affecting practice
• New compliance requirements to consider
• Best practices for client communication
• Strategic recommendations for law firms

Stay informed and ensure your practice remains compliant with evolving legal standards.

#LegalUpdate #LawFirm #Compliance #LegalAdvice`

      setGeneratedContent(generated)

      // Auto-populate platform content
      const newContent: PlatformContent = {}
      selectedPlatforms.forEach((platform) => {
        if (platform === "twitter") {
          newContent[platform] = {
            content: generated.substring(0, 240) + "...", // Truncate for Twitter
          }
        } else if (platform === "youtube") {
          newContent[platform] = {
            title: `Legal Update: ${prompt}`,
            description: generated,
          }
        } else {
          newContent[platform] = {
            content: generated,
          }
        }
      })
      setPlatformContent(newContent)

      toast({
        title: "Content Generated!",
        description: "AI has generated content for your selected platforms",
      })
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate content. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePlatformChange = (platformId: string, checked: boolean) => {
    const newPlatforms = checked
      ? [...selectedPlatforms, platformId]
      : selectedPlatforms.filter((p) => p !== platformId)

    setSelectedPlatforms(newPlatforms)
  }

  const updatePlatformContent = (platform: string, field: string, value: string) => {
    setPlatformContent((prev) => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        [field]: value,
      },
    }))
  }

  const handleMediaUpload = (platform: string, file: File | null) => {
    setPlatformContent((prev) => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        media: file,
      },
    }))
  }

  const publishToAyrshare = async () => {
    if (selectedPlatforms.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one platform",
        variant: "destructive",
      })
      return
    }

    setIsPublishing(true)

    // Initialize delivery status
    const statuses: DeliveryStatus[] = selectedPlatforms.map((platform) => ({
      platform,
      status: "pending",
    }))
    setDeliveryStatus(statuses)

    try {
      // Simulate Ayrshare API calls for each platform
      for (let i = 0; i < selectedPlatforms.length; i++) {
        const platform = selectedPlatforms[i]
        const content = platformContent[platform]

        // Simulate API call delay
        await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000))

        // Validate required fields
        let success = true
        let message = "Posted successfully"

        if (platform === "instagram" && !content?.media) {
          success = false
          message = "Image required for Instagram"
        } else if (platform === "youtube" && (!content?.media || !content?.title)) {
          success = false
          message = "Video and title required for YouTube"
        } else if (!content?.content && platform !== "youtube") {
          success = false
          message = "Content is required"
        } else {
          // Simulate 90% success rate
          success = Math.random() > 0.1
          if (!success) message = "API error - please try again"
        }

        // Update status
        setDeliveryStatus((prev) =>
          prev.map((status) =>
            status.platform === platform
              ? {
                  ...status,
                  status: success ? "success" : "failed",
                  message,
                }
              : status,
          ),
        )
      }

      toast({
        title: "Publishing Completed!",
        description: `Content distributed to ${selectedPlatforms.length} platform(s) via Ayrshare`,
      })
    } catch (error) {
      toast({
        title: "Publishing Failed",
        description: "There was an error with Ayrshare distribution",
        variant: "destructive",
      })
    } finally {
      setIsPublishing(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied!",
      description: "URL copied to clipboard",
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <DashboardHeader />

      <Tabs defaultValue="generate" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="generate">Generate & Distribute</TabsTrigger>
          <TabsTrigger value="history">Post History</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="mt-6 space-y-6">
          {/* Content Generation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5" />
                AI Content Generation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="prompt">Content Prompt</Label>
                <Textarea
                  id="prompt"
                  placeholder="Enter your prompt for AI content generation (e.g., 'Create a post about new employment law changes')"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              <Button onClick={generateContent} disabled={isGenerating || !prompt.trim()}>
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Content...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Generate Content
                  </>
                )}
              </Button>

              {generatedContent && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <Label className="text-sm font-medium">Generated Content:</Label>
                  <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{generatedContent}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Platform Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5" />
                Select Distribution Platforms
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {platforms.map((platform) => (
                  <div key={platform.id} className={`p-4 rounded-lg border-2 ${platform.color}`}>
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id={platform.id}
                        checked={selectedPlatforms.includes(platform.id)}
                        onCheckedChange={(checked) => handlePlatformChange(platform.id, checked as boolean)}
                      />
                      <div className="flex-1">
                        <Label htmlFor={platform.id} className="flex items-center gap-2 cursor-pointer font-medium">
                          <span className="text-xl">{platform.icon}</span>
                          {platform.name}
                          {platform.requiresMedia && (
                            <Badge variant="outline" className="text-xs">
                              {platform.mediaType} required
                            </Badge>
                          )}
                        </Label>
                        <p className="text-xs text-gray-600 mt-1">{platform.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Platform-Specific Content Forms */}
          {selectedPlatforms.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Platform-Specific Content</h3>
              {selectedPlatforms.map((platformId) => {
                const platform = platforms.find((p) => p.id === platformId)
                if (!platform) return null

                return (
                  <Card key={platformId} className={platform.color}>
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-3">
                        <span className="text-2xl">{platform.icon}</span>
                        <span>{platform.name}</span>
                        {platform.requiresMedia && (
                          <Badge variant="outline" className="ml-auto">
                            {platform.mediaType} required
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Content field for most platforms */}
                      {platformId !== "youtube" && (
                        <div className="space-y-2">
                          <Label htmlFor={`${platformId}-content`}>
                            {platformId === "instagram" ? "Caption" : "Post Content"}
                            <span className="text-red-500 ml-1">*</span>
                          </Label>
                          <Textarea
                            id={`${platformId}-content`}
                            placeholder={`Enter content for ${platform.name}...`}
                            value={platformContent[platformId]?.content || ""}
                            onChange={(e) => updatePlatformContent(platformId, "content", e.target.value)}
                            className="min-h-[120px]"
                            maxLength={platformId === "twitter" ? 280 : undefined}
                          />
                          {platformId === "twitter" && (
                            <div className="text-xs text-gray-500">
                              {(platformContent[platformId]?.content || "").length}/280 characters
                            </div>
                          )}
                        </div>
                      )}

                      {/* YouTube specific fields */}
                      {platformId === "youtube" && (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor={`${platformId}-title`}>
                              Video Title <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id={`${platformId}-title`}
                              placeholder="Enter video title..."
                              value={platformContent[platformId]?.title || ""}
                              onChange={(e) => updatePlatformContent(platformId, "title", e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`${platformId}-description`}>
                              Video Description <span className="text-red-500">*</span>
                            </Label>
                            <Textarea
                              id={`${platformId}-description`}
                              placeholder="Enter video description..."
                              value={platformContent[platformId]?.description || ""}
                              onChange={(e) => updatePlatformContent(platformId, "description", e.target.value)}
                              className="min-h-[120px]"
                            />
                          </div>
                        </>
                      )}

                      {/* Media upload */}
                      <div className="space-y-2">
                        <Label htmlFor={`${platformId}-media`} className="flex items-center gap-2">
                          {platform.mediaType === "video" ? (
                            <Video className="h-4 w-4" />
                          ) : (
                            <ImageIcon className="h-4 w-4" />
                          )}
                          {platform.requiresMedia ? (
                            <>
                              {platform.mediaType === "video" ? "Video File" : "Image File"}
                              <span className="text-red-500">*</span>
                            </>
                          ) : (
                            "Media (Optional)"
                          )}
                        </Label>
                        <Input
                          id={`${platformId}-media`}
                          type="file"
                          accept={platform.mediaType === "video" ? "video/*" : "image/*"}
                          onChange={(e) => handleMediaUpload(platformId, e.target.files?.[0] || null)}
                          className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        {platform.requiresMedia && (
                          <p className="text-xs text-red-600 flex items-center gap-1">
                            <Upload className="h-3 w-3" />
                            This file is required for {platform.name}
                          </p>
                        )}
                      </div>

                      {/* Platform-specific notes */}
                      {platformId === "instagram" && (
                        <div className="p-3 bg-pink-100 rounded-lg">
                          <p className="text-xs text-pink-800">
                            📷 Instagram requires an image. Square format (1:1) works best for feed posts.
                          </p>
                        </div>
                      )}

                      {platformId === "youtube" && (
                        <div className="p-3 bg-red-100 rounded-lg">
                          <p className="text-xs text-red-800">
                            📺 YouTube requires a video file. Recommended formats: MP4, MOV, AVI. Max file size: 128GB.
                          </p>
                        </div>
                      )}

                      {platformId === "twitter" && (
                        <div className="p-3 bg-sky-100 rounded-lg">
                          <p className="text-xs text-sky-800">
                            🐦 Twitter has a 280-character limit. Media files are optional but can increase engagement.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {/* Location & URL Generation */}
          {selectedPlatforms.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Location & Custom URL Generation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <LocationUrlGenerator
                  postTitle="Legal Marketing Post"
                  onUrlGenerated={(urls) => setGeneratedUrls(urls)}
                />

                {generatedUrls.full && (
                  <div className="mt-4 space-y-3 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <Label>Full URL:</Label>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(generatedUrls.full)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-blue-600 break-all font-mono">{generatedUrls.full}</p>

                    <div className="flex items-center justify-between">
                      <Label>Short URL:</Label>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(generatedUrls.short)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-blue-600 break-all font-mono">{generatedUrls.short}</p>

                    <Button variant="outline" size="sm" className="mt-2">
                      <QrCode className="h-4 w-4 mr-2" />
                      Generate QR Code
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Publish Button */}
          {selectedPlatforms.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <Button
                  onClick={publishToAyrshare}
                  disabled={isPublishing || selectedPlatforms.length === 0}
                  className="w-full"
                  size="lg"
                >
                  {isPublishing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Publishing to {selectedPlatforms.length} platform{selectedPlatforms.length !== 1 ? "s" : ""}...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Distribute via Ayrshare to {selectedPlatforms.length} Platform
                      {selectedPlatforms.length !== 1 ? "s" : ""}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Delivery Status */}
          {deliveryStatus.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Ayrshare Delivery Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {deliveryStatus.map((status) => {
                    const platform = platforms.find((p) => p.id === status.platform)
                    return (
                      <div key={status.platform} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{platform?.icon}</span>
                          <span className="font-medium capitalize">{platform?.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(status.status)}
                          <span className="text-sm capitalize">{status.status}</span>
                          {status.message && <span className="text-xs text-gray-500">- {status.message}</span>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Post History</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 text-center py-8">No posts published yet. Create your first post above!</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
