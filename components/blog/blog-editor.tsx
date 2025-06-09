"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { Eye, Save, Send, Trash2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface BlogPost {
  id?: string
  title: string
  content: string
  excerpt: string
  image: string
  category: string
  status: "draft" | "published"
}

const EMPTY_POST: BlogPost = {
  title: "",
  content: "",
  excerpt: "",
  image: "/placeholder.svg?height=400&width=800",
  category: "legal-advice",
  status: "draft",
}

export default function BlogEditor({ postId }: { postId?: string }) {
  const router = useRouter()
  const [post, setPost] = useState<BlogPost>(EMPTY_POST)
  const [preview, setPreview] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (postId) {
      // Than fetch the post data from API
      // For now, we'll use mock data
      setPost({
        id: postId,
        title: "Master Layer: Your fall Style Guide",
        content:
          "# Master Layer: Your fall Style Guide\n\nLorem ipsum is placeholder text commonly used in the graphic, print, and publishing industries for previewing layouts.\n\n## Introduction\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.\n\n## Legal Considerations\n\n1. First point\n2. Second point\n3. Third point\n\n> Important quote or legal precedent here.",
        excerpt:
          "Lorem ipsum is placeholder text commonly used in the graphic, print, and publishing industries for previewing layouts.",
        image: "/placeholder.svg?height=400&width=800",
        category: "legal-advice",
        status: "published",
      })
    }
  }, [postId])

  const handleChange = (field: keyof BlogPost, value: string) => {
    setPost((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async (newStatus?: "draft" | "published") => {
    setIsSaving(true)

    try {
      // In a real app, save to API
      // For now, just simulate a delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      if (newStatus) {
        setPost((prev) => ({ ...prev, status: newStatus }))
      }

      // Navigate back to blog list after saving
      router.push("/blog")
    } catch (error) {
      console.error("Error saving post:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post?")) return

    try {
      // In a real app, delete via API
      // For now, just simulate a delay
      await new Promise((resolve) => setTimeout(resolve, 1000))
      router.push("/blog")
    } catch (error) {
      console.error("Error deleting post:", error)
    }
  }

  const renderMarkdown = (markdown: string) => {
    // This is a very simple markdown renderer for demonstration
    // In a real app, use a proper markdown library
    return (
      <div
        className="prose max-w-none"
        dangerouslySetInnerHTML={{
          __html: markdown
            .replace(/^# (.*$)/gm, "<h1>$1</h1>")
            .replace(/^## (.*$)/gm, "<h2>$1</h2>")
            .replace(/^### (.*$)/gm, "<h3>$1</h3>")
            .replace(/\*\*(.*)\*\*/gm, "<strong>$1</strong>")
            .replace(/\*(.*)\*/gm, "<em>$1</em>")
            .replace(/\n/gm, "<br />")
            .replace(/^> (.*$)/gm, "<blockquote>$1</blockquote>")
            .replace(/^(\d+)\. (.*$)/gm, "<ol><li>$2</li></ol>"),
        }}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <Label htmlFor="post-title">Title</Label>
          <Input
            id="post-title"
            value={post.title}
            onChange={(e) => handleChange("title", e.target.value)}
            placeholder="Enter post title"
            className="max-w-2xl"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPreview(!preview)} className="flex items-center gap-2">
            <Eye size={16} />
            {preview ? "Edit" : "Preview"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSave("draft")}
            disabled={isSaving}
            className="flex items-center gap-2"
          >
            <Save size={16} />
            Save Draft
          </Button>
          <Button
            size="sm"
            onClick={() => handleSave("published")}
            disabled={isSaving}
            className="flex items-center gap-2"
          >
            <Send size={16} />
            Publish
          </Button>
          {postId && (
            <Button variant="destructive" size="sm" onClick={handleDelete} className="flex items-center gap-2">
              <Trash2 size={16} />
              Delete
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          {preview ? (
            <div className="border rounded-md p-6 min-h-[400px] bg-white">
              <h1 className="text-2xl font-bold mb-4">{post.title}</h1>
              {renderMarkdown(post.content)}
            </div>
          ) : (
            <Tabs defaultValue="write">
              <TabsList>
                <TabsTrigger value="write">Write</TabsTrigger>
                <TabsTrigger value="markdown">Markdown</TabsTrigger>
              </TabsList>
              <TabsContent value="write" className="space-y-4">
                <Textarea
                  value={post.content}
                  onChange={(e) => handleChange("content", e.target.value)}
                  placeholder="Write your blog post content here..."
                  className="min-h-[400px]"
                />
              </TabsContent>
              <TabsContent value="markdown">
                <div className="border rounded-md p-4 min-h-[400px] bg-gray-50 font-mono text-sm">{post.content}</div>
              </TabsContent>
            </Tabs>
          )}
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="post-excerpt">Excerpt</Label>
            <Textarea
              id="post-excerpt"
              value={post.excerpt}
              onChange={(e) => handleChange("excerpt", e.target.value)}
              placeholder="Brief summary of your post"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="post-image">Featured Image</Label>
            <div className="border rounded-md overflow-hidden">
              <img src={post.image || "/placeholder.svg"} alt="Featured" className="w-full h-40 object-cover" />
            </div>
            <Input
              id="post-image"
              type="text"
              value={post.image}
              onChange={(e) => handleChange("image", e.target.value)}
              placeholder="Image URL"
              className="mt-2"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="post-category">Category</Label>
            <Select value={post.category} onValueChange={(value) => handleChange("category", value)}>
              <SelectTrigger id="post-category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="legal-advice">Legal Advice</SelectItem>
                <SelectItem value="case-studies">Case Studies</SelectItem>
                <SelectItem value="law-updates">Law Updates</SelectItem>
                <SelectItem value="firm-news">Firm News</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  )
}
