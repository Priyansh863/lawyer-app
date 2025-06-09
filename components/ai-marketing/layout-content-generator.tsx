"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Wand2, Send, Edit, Copy, Loader2 } from "lucide-react"
import PostPreview from "@/components/ai-marketing/post-preview"
import { generateLegalContent, publishPost, saveAsDraft } from "@/lib/api/marketing-api"
import type { LegalPost, PostPlatform } from "@/types/marketing"

export default function LegalContentGenerator() {
  const [prompt, setPrompt] = useState("")
  const [contentType, setContentType] = useState<string>("social")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [generatedPost, setGeneratedPost] = useState<LegalPost | null>(null)
  const [targetRegion, setTargetRegion] = useState("")
  const [showApprovalForm, setShowApprovalForm] = useState(false)
  const { toast } = useToast()

  const handleGenerateContent = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Empty prompt",
        description: "Please enter a prompt to generate content",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    try {
      const post = await generateLegalContent({
        prompt,
        contentType,
      })

      setGeneratedPost(post)
      setShowApprovalForm(false)

      toast({
        title: "Content generated",
        description: "Your legal content has been generated successfully",
      })
    } catch (error) {
      toast({
        title: "Generation failed",
        description: "There was an error generating your content",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleApproveForPublishing = () => {
    setShowApprovalForm(true)
  }

  const handlePublishPost = async () => {
    if (!generatedPost) return

    if (!targetRegion.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter a target region/jurisdiction",
        variant: "destructive",
      })
      return
    }

    setIsPublishing(true)
    try {
      await publishPost({
        postId: generatedPost.id,
        targetRegion,
        platforms: ["linkedin", "twitter", "facebook"] as PostPlatform[],
      })

      toast({
        title: "Post published",
        description: "Your content has been published to social media",
      })

      // Reset the form
      setGeneratedPost(null)
      setPrompt("")
      setTargetRegion("")
      setShowApprovalForm(false)
    } catch (error) {
      toast({
        title: "Publishing failed",
        description: "There was an error publishing your content",
        variant: "destructive",
      })
    } finally {
      setIsPublishing(false)
    }
  }

  const handleSaveAsDraft = async () => {
    if (!generatedPost) return

    try {
      await saveAsDraft(generatedPost.id)

      toast({
        title: "Draft saved",
        description: "Your content has been saved as a draft",
      })
    } catch (error) {
      toast({
        title: "Save failed",
        description: "There was an error saving your draft",
        variant: "destructive",
      })
    }
  }

  const handleCloneToBlog = async () => {
    if (!generatedPost) return

    try {
      // In a real implementation, this would clone the post to the blog system
      toast({
        title: "Cloned to blog",
        description: "Your content has been cloned to the blog system",
      })
    } catch (error) {
      toast({
        title: "Clone failed",
        description: "There was an error cloning to blog",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="content-type">Content Type</Label>
              <Select value={contentType} onValueChange={setContentType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select content type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="social">Social Media Post</SelectItem>
                  <SelectItem value="blog">Blog Post</SelectItem>
                  <SelectItem value="newsletter">Newsletter</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prompt">Prompt</Label>
              <Textarea
                id="prompt"
                placeholder="Enter your prompt (e.g., 'Write a post about recent changes to family law in California')"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[120px]"
              />
            </div>

            <Button onClick={handleGenerateContent} disabled={!prompt.trim() || isGenerating} className="w-full">
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Generate Content
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {generatedPost && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Post Preview</h3>

              <PostPreview post={generatedPost} />

              {showApprovalForm ? (
                <div className="space-y-4 border rounded-md p-4 bg-muted/30">
                  <div className="space-y-2">
                    <Label htmlFor="target-region">Target Region/Jurisdiction</Label>
                    <Input
                      id="target-region"
                      placeholder="Enter target region or jurisdiction (e.g., 'California', 'New York')"
                      value={targetRegion}
                      onChange={(e) => setTargetRegion(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button onClick={handlePublishPost} disabled={isPublishing || !targetRegion.trim()}>
                      {isPublishing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Publishing...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Publish Now
                        </>
                      )}
                    </Button>

                    <Button variant="outline" onClick={() => setShowApprovalForm(false)}>
                      Back to Edit
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <Button onClick={handleApproveForPublishing}>
                    <Send className="mr-2 h-4 w-4" />
                    Post
                  </Button>

                  <Button variant="outline">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>

                  <Button variant="outline" onClick={handleCloneToBlog}>
                    <Copy className="mr-2 h-4 w-4" />
                    Clone to Blog
                  </Button>

                  <Button variant="secondary" onClick={handleSaveAsDraft}>
                    Save as Draft
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
