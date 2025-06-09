"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useToast } from "@/hooks/use-toast"
import { Wand2, Send, Edit, Copy, Loader2 } from "lucide-react"
import PostPreview from "@/components/ai-marketing/post-preview"
import { generateLegalContent, publishPost, saveAsDraft } from "@/lib/api/marketing-api"
import type { LegalPost, PostPlatform } from "@/types/marketing"

const contentGenerationSchema = z.object({
  prompt: z.string().min(10, "Prompt must be at least 10 characters").max(500, "Prompt too long"),
  contentType: z.enum(["social", "blog", "newsletter"]),
})

type ContentGenerationData = z.infer<typeof contentGenerationSchema>

const publishFormSchema = z.object({
  targetRegion: z.string().min(2, "Target region is required"),
  platforms: z.array(z.enum(["linkedin", "twitter", "facebook"])).min(1, "Select at least one platform"),
})

type PublishFormData = z.infer<typeof publishFormSchema>

export default function LegalContentGenerator() {
  const [generatedPost, setGeneratedPost] = useState<LegalPost | null>(null)
  const [showApprovalForm, setShowApprovalForm] = useState(false)
  const { toast } = useToast()

  // Content generation form
  const contentForm = useForm<ContentGenerationData>({
    resolver: zodResolver(contentGenerationSchema),
    defaultValues: {
      prompt: "",
      contentType: "social",
    },
  })

  // Publishing form
  const publishForm = useForm<PublishFormData>({
    resolver: zodResolver(publishFormSchema),
    defaultValues: {
      targetRegion: "",
      platforms: ["linkedin"],
    },
  })

  const onContentSubmit = async (data: ContentGenerationData) => {
    try {
      const post = await generateLegalContent({
        prompt: data.prompt,
        contentType: data.contentType,
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
    }
  }

  const onPublishSubmit = async (data: PublishFormData) => {
    if (!generatedPost) return

    try {
      await publishPost({
        postId: generatedPost.id,
        targetRegion: data.targetRegion,
        platforms: data.platforms as PostPlatform[],
      })

      toast({
        title: "Post published",
        description: "Your content has been published to social media",
      })

      // Reset the forms
      setGeneratedPost(null)
      contentForm.reset()
      publishForm.reset()
      setShowApprovalForm(false)
    } catch (error) {
      toast({
        title: "Publishing failed",
        description: "There was an error publishing your content",
        variant: "destructive",
      })
    }
  }

  const handleApproveForPublishing = () => {
    setShowApprovalForm(true)
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
          <Form {...contentForm}>
            <form onSubmit={contentForm.handleSubmit(onContentSubmit)} className="space-y-4">
              <FormField
                control={contentForm.control}
                name="contentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select content type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="social">Social Media Post</SelectItem>
                        <SelectItem value="blog">Blog Post</SelectItem>
                        <SelectItem value="newsletter">Newsletter</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={contentForm.control}
                name="prompt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prompt</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter your prompt (e.g., 'Write a post about recent changes to family law in California')"
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={contentForm.formState.isSubmitting} className="w-full">
                {contentForm.formState.isSubmitting ? (
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
            </form>
          </Form>
        </CardContent>
      </Card>

      {generatedPost && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Post Preview</h3>

              <PostPreview post={generatedPost} />

              {showApprovalForm ? (
                <Form {...publishForm}>
                  <form
                    onSubmit={publishForm.handleSubmit(onPublishSubmit)}
                    className="space-y-4 border rounded-md p-4 bg-muted/30"
                  >
                    <FormField
                      control={publishForm.control}
                      name="targetRegion"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Target Region/Jurisdiction</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter target region or jurisdiction (e.g., 'California', 'New York')"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={publishForm.control}
                      name="platforms"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Publishing Platforms</FormLabel>
                          <div className="flex flex-wrap gap-2">
                            {["linkedin", "twitter", "facebook"].map((platform) => (
                              <label key={platform} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={field.value.includes(platform as PostPlatform)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      field.onChange([...field.value, platform])
                                    } else {
                                      field.onChange(field.value.filter((p) => p !== platform))
                                    }
                                  }}
                                />
                                <span className="capitalize">{platform}</span>
                              </label>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex flex-wrap gap-2">
                      <Button type="submit" disabled={publishForm.formState.isSubmitting}>
                        {publishForm.formState.isSubmitting ? (
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

                      <Button type="button" variant="outline" onClick={() => setShowApprovalForm(false)}>
                        Back to Edit
                      </Button>
                    </div>
                  </form>
                </Form>
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
