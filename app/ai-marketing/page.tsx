"use client"

import { useState, useEffect, useCallback } from "react"
import DashboardHeader from "@/components/dashboard/dashboard-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/hooks/useTranslation"
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
  MapPin,
  FileText,
  Globe,
  Mountain,
  Building,
  Link,
} from "lucide-react"
import LocationUrlGenerator from "@/components/ai-marketing/location-url-generator"
import {
  FacebookShareButton,
  TwitterShareButton,
  LinkedinShareButton,
  WhatsappShareButton,
  TelegramShareButton,
  RedditShareButton,
  EmailShareButton,
  FacebookIcon,
  TwitterIcon,
  LinkedinIcon,
  WhatsappIcon,
  TelegramIcon,
  RedditIcon,
  EmailIcon,
} from "react-share"
import {
  type SpatialInfo,
  generatePost,
  createPost,
  generateCustomUrl,
  generateShortUrl,
  validateSpatialInfo,
} from "@/lib/api/post-api"
// import LocationInput from "@/components/location/location-input" // Removed as LocationUrlGenerator is now primary

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
  const [activeTab, setActiveTab] = useState("generator")
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [platformContent, setPlatformContent] = useState<PlatformContent>({})
  const [generatedContent, setGeneratedContent] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [deliveryStatus, setDeliveryStatus] = useState<DeliveryStatus[]>([])
  const [prompt, setPrompt] = useState("")
  const [generatedUrls, setGeneratedUrls] = useState({ full: "", short: "" }) // From LocationUrlGenerator
  const [spatialInfo, setSpatialInfo] = useState<SpatialInfo | undefined>(undefined) // From LocationUrlGenerator
  const [customUrl, setCustomUrl] = useState("") // Managed by AIMarketingPage's useEffect
  const [shortUrl, setShortUrl] = useState("") // Managed by AIMarketingPage's useEffect
  const [qrCodeUrl, setQrCodeUrl] = useState("") // Managed by AIMarketingPage's useEffect and createPost

  const [isCreatingPost, setIsCreatingPost] = useState(false)

  const { toast } = useToast()
  const { t } = useTranslation()

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
    if (!prompt.trim()) return
    setIsGenerating(true)
    try {
      // Call backend to generate post content
      const response = await generatePost(prompt)
      console.log(response, "responseresponseresponseresponseresponseresponse")
      const generatedContent = response.content
      setGeneratedContent(generatedContent)

      // Auto-populate platform content
      const newContent: PlatformContent = {}
      selectedPlatforms.forEach((platform) => {
        if (platform === "twitter") {
          newContent[platform] = {
            content: generatedContent.substring(0, 240) + "...", // Truncate for Twitter
          }
        } else if (platform === "youtube") {
          newContent[platform] = {
            title: `Legal Update: ${prompt}`,
            description: generatedContent,
          }
        } else {
          newContent[platform] = {
            content: generatedContent,
          }
        }
      })
      setPlatformContent(newContent)
      toast({
        title: "Content Generated!",
        description: "Your AI-powered legal content is ready for distribution.",
      })
    } catch (error: any) {
      console.error("Error generating content:", error)
      toast({
        title: "Generation Failed",
        description: error.message || "There was an error generating content. Please try again.",
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

  // Generate URLs with spatial information
  const generateUrls = useCallback((content: string, spatial?: SpatialInfo) => {
    if (!content.trim()) return
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://yourapp.com"
    const postTitle = content.substring(0, 50).replace(/[^\w\s]/gi, "") || "AI Generated Content"
    const fullUrl = generateCustomUrl(baseUrl, postTitle, spatial)
    const shortUrlGenerated = generateShortUrl(baseUrl, postTitle, spatial)
    setCustomUrl(fullUrl)
    setShortUrl(shortUrlGenerated)
    return { fullUrl, shortUrlGenerated }
  }, [])

  // Create post with spatial metadata
  const createPostWithLocation = useCallback(async () => {
    if (!generatedContent.trim()) {
      toast({
        title: t("common.error"),
        description: t("pages:aiMarketing.generateContent"),
        variant: "destructive",
      })
      return
    }

    // Validate spatial info if provided
    if (spatialInfo) {
      const errors = validateSpatialInfo(spatialInfo)
      if (errors.length > 0) {
        toast({
          title: t("common.error"),
          description: errors[0],
          variant: "destructive",
        })
        return
      }
    }

    setIsCreatingPost(true)
    try {
      const postTitle = generatedContent.substring(0, 50).replace(/[^\w\s]/gi, "") || "AI Generated Content"
      const postData = {
        title: postTitle,
        content: generatedContent,
        spatialInfo,
        status: "published" as const,
      }
      const createdPost = await createPost(postData)

      // Update URLs with the actual post data
      if (createdPost.customUrl) setCustomUrl(createdPost.customUrl)
      if (createdPost.shortUrl) setShortUrl(createdPost.shortUrl)
      if (createdPost.qrCodeUrl) setQrCodeUrl(createdPost.qrCodeUrl)

      toast({
        title: t("common.success"),
        description: t("pages:aiMarketing.contentGenerated"),
      })
    } catch (error: any) {
      console.error("Error creating post:", error)
      toast({
        title: t("common.error"),
        description: error.message || t("common.error"),
        variant: "destructive",
      })
    } finally {
      setIsCreatingPost(false)
    }
  }, [generatedContent, spatialInfo, toast, t])

  // Update URLs when content or spatial info changes
  useEffect(() => {
    if (generatedContent) {
      generateUrls(generatedContent, spatialInfo)
    }
  }, [generatedContent, spatialInfo, generateUrls])

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
      title: t("common.copied"),
      description: t("common.copied"),
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <DashboardHeader />
      <Tabs defaultValue="generate" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="generate">{t("pages:aiMarketing.generateContent")}</TabsTrigger>
          <TabsTrigger value="location">{t("pages:aiMarketing.locationUrls")}</TabsTrigger>
          <TabsTrigger value="history">{t("pages:aiMarketing.title")}</TabsTrigger>
        </TabsList>
        <TabsContent value="generate" className="mt-6 space-y-6">
          {/* Content Generation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5" />
                {t("pages:aiMarketing.generateContent")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="prompt">{t("pages:aiMarketing.contentPrompt")}</Label>
                <Textarea
                  id="prompt"
                  placeholder={t("pages:aiMarketing.enterPrompt")}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
              <Button onClick={generateContent} disabled={isGenerating || !prompt.trim()}>
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("pages:aiMarketing.generating")}
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    {t("pages:aiMarketing.generateContent")}
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
          {/* Platform Selection with React Share Social */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5" />
                {t("pages:aiMarketing.shareOnSocial")}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-2">{t("pages:aiMarketing.shareOnSocial")}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Content Preview */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <Label className="text-sm font-medium mb-2 block">{t("pages:aiMarketing.generatedContent")}:</Label>
                  <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap line-clamp-4">
                    {generatedContent || "Generate content to see a preview here."}
                  </p>
                </div>
                {/* Social Share Buttons */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm">{t("pages:aiMarketing.shareOnSocial")}:</h4>
                  <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {/* Facebook */}
                    <div className="flex flex-col items-center space-y-2">
                      <FacebookShareButton
                        url={generatedUrls.full || (typeof window !== "undefined" ? window.location.href : "")}
                        // quote={generatedContent || "Check out this AI-generated content!"}
                        className="hover:scale-110 transition-transform"
                      >
                        <FacebookIcon size={48} round />
                      </FacebookShareButton>
                      <span className="text-xs text-gray-600">Facebook</span>
                    </div>
                    {/* Twitter */}
                    <div className="flex flex-col items-center space-y-2">
                      <TwitterShareButton
                        url={generatedUrls.full || (typeof window !== "undefined" ? window.location.href : "")}
                        title={
                          generatedContent.length > 0
                            ? generatedContent.length > 240
                              ? generatedContent.substring(0, 200) + "..."
                              : generatedContent
                            : "Check out this AI-generated content!"
                        }
                        className="hover:scale-110 transition-transform"
                      >
                        <TwitterIcon size={48} round />
                      </TwitterShareButton>
                      <span className="text-xs text-gray-600">Twitter</span>
                    </div>
                    {/* LinkedIn */}
                    <div className="flex flex-col items-center space-y-2">
                      <LinkedinShareButton
                        url={generatedUrls.full || (typeof window !== "undefined" ? window.location.href : "")}
                        title={generatedContent.split("\n")[0] || "AI-Generated Content"}
                        summary={generatedContent || "Check out this AI-generated content!"}
                        className="hover:scale-110 transition-transform"
                      >
                        <LinkedinIcon size={48} round />
                      </LinkedinShareButton>
                      <span className="text-xs text-gray-600">LinkedIn</span>
                    </div>
                    {/* WhatsApp */}
                    <div className="flex flex-col items-center space-y-2">
                      <WhatsappShareButton
                        url={generatedUrls.full || (typeof window !== "undefined" ? window.location.href : "")}
                        title={generatedContent || "Check out this AI-generated content!"}
                        className="hover:scale-110 transition-transform"
                      >
                        <WhatsappIcon size={48} round />
                      </WhatsappShareButton>
                      <span className="text-xs text-gray-600">WhatsApp</span>
                    </div>
                    {/* Telegram */}
                    <div className="flex flex-col items-center space-y-2">
                      <TelegramShareButton
                        url={generatedUrls.full || (typeof window !== "undefined" ? window.location.href : "")}
                        title={generatedContent || "Check out this AI-generated content!"}
                        className="hover:scale-110 transition-transform"
                      >
                        <TelegramIcon size={48} round />
                      </TelegramShareButton>
                      <span className="text-xs text-gray-600">Telegram</span>
                    </div>
                    {/* Email */}
                    <div className="flex flex-col items-center space-y-2">
                      <EmailShareButton
                        url={generatedUrls.full || (typeof window !== "undefined" ? window.location.href : "")}
                        subject={generatedContent.split("\n")[0] || "AI-Generated Content"}
                        body={`${generatedContent || "Check out this AI-generated content!"}\n\n${generatedUrls.full || (typeof window !== "undefined" ? window.location.href : "")}`}
                        className="hover:scale-110 transition-transform"
                      >
                        <EmailIcon size={48} round />
                      </EmailShareButton>
                      <span className="text-xs text-gray-600">Email</span>
                    </div>
                  </div>
                </div>
                {/* Additional Share Options */}
                <div className="border-t pt-4">
                  <h4 className="font-medium text-sm mb-3">More Sharing Options:</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {/* Reddit */}
                    <div className="flex flex-col items-center space-y-2">
                      <RedditShareButton
                        url={generatedUrls.full || (typeof window !== "undefined" ? window.location.href : "")}
                        title={generatedContent.split("\n")[0] || "AI-Generated Content"}
                        className="hover:scale-110 transition-transform"
                      >
                        <RedditIcon size={48} round />
                      </RedditShareButton>
                      <span className="text-xs text-gray-600">Reddit</span>
                    </div>
                    {/* Copy Link */}
                    <div className="flex flex-col items-center space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const urlToCopy =
                            generatedUrls.full || (typeof window !== "undefined" ? window.location.href : "")
                          navigator.clipboard.writeText(
                            `${generatedContent || "Check out this AI-generated content!"}\n\n${urlToCopy}`,
                          )
                          toast({
                            title: "Copied!",
                            description: "Content and link copied to clipboard",
                          })
                        }}
                        className="w-12 h-12 rounded-full p-0 hover:scale-110 transition-transform"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <span className="text-xs text-gray-600">Copy</span>
                    </div>
                  </div>
                </div>
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
                  postTitle={generatedContent.substring(0, 50).replace(/[^\w\s]/gi, "") || "AI Generated Content"}
                  onUrlGenerated={setGeneratedUrls}
                  onQrGenerated={setQrCodeUrl}
                  onSpatialInfoChange={setSpatialInfo} // Pass the spatial info setter
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
                    {qrCodeUrl && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">QR Code:</Label>
                        <div className="flex justify-center p-4 bg-white rounded-lg border">
                          <img src={qrCodeUrl || "/placeholder.svg"} alt="QR Code for post" className="w-32 h-32" />
                        </div>
                        <p className="text-xs text-gray-500 text-center">
                          Scan this QR code to access your post with location data
                        </p>
                      </div>
                    )}
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
        <TabsContent value="location" className="mt-6 space-y-6">
          {/* Location Input */}
          <Card>
           <CardHeader>
  <CardTitle className="flex items-center gap-2">
    <MapPin className="h-5 w-5" />
    {t("pages:aiMarketing.addLocationTitle")}
  </CardTitle>
  <p className="text-sm text-gray-600">
    {t("pages:aiMarketing.addLocationSubtitle")}
  </p>
</CardHeader>

            <CardContent>
              {/* Using LocationUrlGenerator directly for all location input methods */}
              <LocationUrlGenerator
                postTitle={generatedContent.substring(0, 50).replace(/[^\w\s]/gi, "") || "AI Generated Content"}
                onUrlGenerated={setGeneratedUrls}
                onQrGenerated={setQrCodeUrl}
                onSpatialInfoChange={setSpatialInfo}
              />
            </CardContent>
          </Card>
          {/* Content Preview with Location */}
          {generatedContent && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Content Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                  <div>
                    <Label className="text-sm font-medium">Generated Content:</Label>
                    <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{generatedContent}</p>
                  </div>
                  {spatialInfo && (
                    <div className="border-t pt-3">
                      <Label className="text-sm font-medium">Location Information:</Label>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                        {spatialInfo.planet && (
                          <div className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            <span>Planet: {spatialInfo.planet}</span>
                          </div>
                        )}
                        {spatialInfo.latitude && spatialInfo.longitude && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span>
                              Coordinates: {spatialInfo.latitude}, {spatialInfo.longitude}
                            </span>
                          </div>
                        )}
                        {spatialInfo.altitude && (
                          <div className="flex items-center gap-1">
                            <Mountain className="h-3 w-3" />
                            <span>Altitude: {spatialInfo.altitude}m</span>
                          </div>
                        )}
                        {spatialInfo.floor && (
                          <div className="flex items-center gap-1">
                            <Building className="h-3 w-3" />
                            <span>Floor: {spatialInfo.floor}</span>
                          </div>
                        )}
                        {spatialInfo.timestamp && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>Time: {new Date(spatialInfo.timestamp).toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
          {/* URL Generation and Display */}
          {generatedContent && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link className="h-5 w-5" />
                  Custom Location URLs
                </CardTitle>
                <p className="text-sm text-gray-600">
                  URLs are automatically generated with your location data for sharing.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Full URL */}
                {generatedUrls.full && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Full URL:</Label>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(generatedUrls.full)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-blue-600 break-all font-mono">{generatedUrls.full}</p>
                    </div>
                  </div>
                )}
                {/* Short URL */}
                {generatedUrls.short && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Short URL:</Label>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(generatedUrls.short)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-green-600 break-all font-mono">{generatedUrls.short}</p>
                    </div>
                  </div>
                )}
                {/* Create Post Button */}
                <div className="pt-4 border-t">
                  <Button
                    onClick={createPostWithLocation}
                    disabled={isCreatingPost || !generatedContent.trim()}
                    className="w-full"
                    size="lg"
                  >
                    {isCreatingPost ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Post with Location...
                      </>
                    ) : (
                      <>
                        <MapPin className="mr-2 h-4 w-4" />
                        Create Post with Location
                      </>
                    )}
                  </Button>
                </div>
                {/* QR Code Display */}
                {qrCodeUrl && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">QR Code:</Label>
                    <div className="flex justify-center p-4 bg-white rounded-lg border">
                      <img src={qrCodeUrl || "/placeholder.svg"} alt="QR Code for post" className="w-32 h-32" />
                    </div>
                    <p className="text-xs text-gray-500 text-center">
                      Scan this QR code to access your post with location data
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          {/* Social Sharing with Location URLs */}
          {generatedContent && (generatedUrls.full || generatedUrls.short) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="h-5 w-5" />
                  Share with Location URLs
                </CardTitle>
                <p className="text-sm text-gray-600">Share your content using the generated location URLs.</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {/* Facebook */}
                  <div className="flex flex-col items-center space-y-2">
                    <FacebookShareButton
                      url={generatedUrls.full || (typeof window !== "undefined" ? window.location.href : "")}
                      className="hover:scale-110 transition-transform"
                    >
                      <FacebookIcon size={48} round />
                    </FacebookShareButton>
                    <span className="text-xs text-gray-600">Facebook</span>
                  </div>
                  {/* Twitter */}
                  <div className="flex flex-col items-center space-y-2">
                    <TwitterShareButton
                      url={generatedUrls.full || (typeof window !== "undefined" ? window.location.href : "")}
                      title={
                        generatedContent.length > 200 ? generatedContent.substring(0, 200) + "..." : generatedContent
                      }
                      className="hover:scale-110 transition-transform"
                    >
                      <TwitterIcon size={48} round />
                    </TwitterShareButton>
                    <span className="text-xs text-gray-600">Twitter</span>
                  </div>
                  {/* LinkedIn */}
                  <div className="flex flex-col items-center space-y-2">
                    <LinkedinShareButton
                      url={generatedUrls.full || (typeof window !== "undefined" ? window.location.href : "")}
                      title={generatedContent.split("\n")[0]}
                      summary={generatedContent}
                      className="hover:scale-110 transition-transform"
                    >
                      <LinkedinIcon size={48} round />
                    </LinkedinShareButton>
                    <span className="text-xs text-gray-600">LinkedIn</span>
                  </div>
                  {/* WhatsApp */}
                  <div className="flex flex-col items-center space-y-2">
                    <WhatsappShareButton
                      url={generatedUrls.full || (typeof window !== "undefined" ? window.location.href : "")}
                      title={generatedContent}
                      className="hover:scale-110 transition-transform"
                    >
                      <WhatsappIcon size={48} round />
                    </WhatsappShareButton>
                    <span className="text-xs text-gray-600">WhatsApp</span>
                  </div>
                  {/* Telegram */}
                  <div className="flex flex-col items-center space-y-2">
                    <TelegramShareButton
                      url={generatedUrls.full || (typeof window !== "undefined" ? window.location.href : "")}
                      title={generatedContent}
                      className="hover:scale-110 transition-transform"
                    >
                      <TelegramIcon size={48} round />
                    </TelegramShareButton>
                    <span className="text-xs text-gray-600">Telegram</span>
                  </div>
                  {/* Email */}
                  <div className="flex flex-col items-center space-y-2">
                    <EmailShareButton
                      url={generatedUrls.full || (typeof window !== "undefined" ? window.location.href : "")}
                      subject={generatedContent.split("\n")[0]}
                      body={`${generatedContent}\n\n${generatedUrls.full || (typeof window !== "undefined" ? window.location.href : "")}`}
                      className="hover:scale-110 transition-transform"
                    >
                      <EmailIcon size={48} round />
                    </EmailShareButton>
                    <span className="text-xs text-gray-600">Email</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          {/* Instructions */}
          {!generatedContent && (
           <Card>
  <CardContent className="p-6 text-center">
    <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
    <h3 className="text-lg font-medium text-gray-900 mb-2">
      {t('pages:aiMarketing.addLocationTitle')}
    </h3>
    <p className="text-gray-600 mb-4">
      {t('pages:aiMarketing.addLocationDescription')}
    </p>
    <Button variant="outline" onClick={() => setActiveTab("generate")}>
      {t('pages:aiMarketing.goToGenerator')}
    </Button>
  </CardContent>
</Card>
          )}
        </TabsContent>
        <TabsContent value="history" className="mt-6">
  <Card>
    <CardHeader>
      <CardTitle>{t("pages:aiMarketing.postHistoryTitle")}</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-gray-500 text-center py-8">
        {t("pages:aiMarketing.noPostsMessage")}
      </p>
    </CardContent>
  </Card>
</TabsContent>

      </Tabs>
    </div>
  )
}
