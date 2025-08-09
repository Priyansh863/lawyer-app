"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Link, 
  Hash, 
  Quote, 
  Building, 
  MapPin, 
  Plus, 
  X, 
  Loader2,
  Copy,
  CheckCircle,
  Globe
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useSelector } from "react-redux"
import { RootState } from "@/lib/store"

// Enhanced API function for URL content generation
const generateUrlContent = async (data: {
  url: string
  description?: string
  hashtags?: string[]
  citations?: string[]
  floor?: string
  address?: string
  language?: string
}) => {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL
  const token = localStorage.getItem('authToken')
  
  const response = await fetch(`${API_BASE_URL}/blog/generate-url-content`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  })
  
  if (!response.ok) {
    throw new Error(`Content generation failed: ${response.statusText}`)
  }
  
  return response.json()
}

interface URLGeneratorProps {
  onContentGenerated?: (content: string) => void
}

export default function URLGenerator({ onContentGenerated }: URLGeneratorProps) {
  const [url, setUrl] = useState("")
  const [description, setDescription] = useState("")
  const [hashtags, setHashtags] = useState<string[]>([])
  const [newHashtag, setNewHashtag] = useState("")
  const [citations, setCitations] = useState<string[]>([])
  const [newCitation, setNewCitation] = useState("")
  const [floor, setFloor] = useState("")
  const [address, setAddress] = useState("")
  const [language, setLanguage] = useState("en")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState("")
  const [copied, setCopied] = useState(false)

  const { toast } = useToast()
  const user = useSelector((state: RootState) => state.auth.user)

  // Language options
  const languageOptions = [
    { value: "en", label: "English", flag: "🇺🇸" },
    { value: "ko", label: "한국어", flag: "🇰🇷" },
    { value: "es", label: "Español", flag: "🇪🇸" },
    { value: "fr", label: "Français", flag: "🇫🇷" },
    { value: "de", label: "Deutsch", flag: "🇩🇪" },
    { value: "ja", label: "日本語", flag: "🇯🇵" }
  ]

  // Add hashtag
  const addHashtag = () => {
    if (newHashtag.trim() && !hashtags.includes(newHashtag.trim())) {
      setHashtags([...hashtags, newHashtag.trim()])
      setNewHashtag("")
    }
  }

  // Remove hashtag
  const removeHashtag = (index: number) => {
    setHashtags(hashtags.filter((_, i) => i !== index))
  }

  // Add citation
  const addCitation = () => {
    if (newCitation.trim() && !citations.includes(newCitation.trim())) {
      setCitations([...citations, newCitation.trim()])
      setNewCitation("")
    }
  }

  // Remove citation
  const removeCitation = (index: number) => {
    setCitations(citations.filter((_, i) => i !== index))
  }

  // Validate URL
  const isValidUrl = (string: string) => {
    try {
      new URL(string)
      return true
    } catch (_) {
      return false
    }
  }

  // Generate content
  const handleGenerate = async () => {
    if (!url.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter a valid URL to generate content.",
        variant: "destructive"
      })
      return
    }

    if (!isValidUrl(url)) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL (including http:// or https://).",
        variant: "destructive"
      })
      return
    }

    setIsGenerating(true)
    try {
      const result = await generateUrlContent({
        url: url.trim(),
        description: description.trim() || undefined,
        hashtags: hashtags.length > 0 ? hashtags : undefined,
        citations: citations.length > 0 ? citations : undefined,
        floor: floor.trim() || undefined,
        address: address.trim() || undefined,
        language
      })

      if (result.success) {
        setGeneratedContent(result.content)
        onContentGenerated?.(result.content)
        toast({
          title: "Content Generated!",
          description: "URL content has been generated successfully."
        })
      } else {
        throw new Error(result.message || 'Generation failed')
      }
    } catch (error: any) {
      console.error('URL content generation error:', error)
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate URL content. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
    }
  }

  // Copy to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedContent)
      setCopied(true)
      toast({
        title: "Copied!",
        description: "Content copied to clipboard."
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy content to clipboard.",
        variant: "destructive"
      })
    }
  }

  // Clear form
  const clearForm = () => {
    setUrl("")
    setDescription("")
    setHashtags([])
    setCitations([])
    setFloor("")
    setAddress("")
    setGeneratedContent("")
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Globe className="h-6 w-6 text-blue-500" />
          URL Content Generator
        </h2>
        <p className="text-muted-foreground">
          Generate engaging marketing content for URL sharing with AI assistance.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link className="h-5 w-5" />
              URL Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* URL Input */}
            <div className="space-y-2">
              <Label htmlFor="url" className="flex items-center gap-2">
                <Link className="h-4 w-4" />
                URL *
              </Label>
              <Input
                id="url"
                type="url"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of the URL content..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            {/* Language Selection */}
            <div className="space-y-2">
              <Label>Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languageOptions.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      <span className="flex items-center gap-2">
                        <span>{lang.flag}</span>
                        <span>{lang.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Hashtags */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Hash className="h-4 w-4" />
                Hashtags
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add hashtag..."
                  value={newHashtag}
                  onChange={(e) => setNewHashtag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addHashtag()}
                />
                <Button onClick={addHashtag} size="sm" variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {hashtags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {hashtags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      #{tag}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 hover:bg-transparent"
                        onClick={() => removeHashtag(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Citations */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Quote className="h-4 w-4" />
                Citations
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add citation source..."
                  value={newCitation}
                  onChange={(e) => setNewCitation(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addCitation()}
                />
                <Button onClick={addCitation} size="sm" variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {citations.length > 0 && (
                <div className="space-y-2">
                  {citations.map((citation, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <Quote className="h-4 w-4 text-gray-500" />
                      <span className="flex-1 text-sm">{citation}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => removeCitation(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Floor */}
            <div className="space-y-2">
              <Label htmlFor="floor" className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                Floor
              </Label>
              <Input
                id="floor"
                placeholder="e.g., 5th Floor, Ground Floor"
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
              />
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Address
              </Label>
              <Input
                id="address"
                placeholder="Enter full address..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button 
                onClick={handleGenerate} 
                disabled={isGenerating || !url.trim()}
                className="flex-1"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Globe className="h-4 w-4 mr-2" />
                    Generate Content
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={clearForm}>
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Generated Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Generated Content
              </span>
              {generatedContent && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyToClipboard}
                  className="flex items-center gap-2"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy
                    </>
                  )}
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!generatedContent ? (
              <div className="text-center py-12 text-muted-foreground">
                <Globe className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Generated content will appear here</p>
                <p className="text-sm">Fill in the URL and click "Generate Content"</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                    {generatedContent}
                  </pre>
                </div>
                
                {/* Content Stats */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Characters: {generatedContent.length}</span>
                  <span>Words: {generatedContent.split(/\s+/).length}</span>
                  <span>Lines: {generatedContent.split('\n').length}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
