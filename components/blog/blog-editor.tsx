"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { Save, Send, Trash2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getUploadFileUrl } from "@/lib/helpers/fileupload"
import { useToast } from "@/components/ui/use-toast"
import { useSelector } from "react-redux"
import { RootState } from "@/lib/store"
import { createBlogPost, updateBlogPost, deleteBlogPost, getBlogPost, BlogPost } from "@/lib/api/blog-api"

const EMPTY_POST = {
  title: "",
  content: "",
  excerpt: "",
  image: "/placeholder.svg?height=400&width=800",
  category: "legal-advice",
  status: "draft" as const,
}

export default function BlogEditor({ postId }: { postId?: string }) {
  const router = useRouter()
  const [post, setPost] = useState<BlogPost | typeof EMPTY_POST>(EMPTY_POST)
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const user = useSelector((state: RootState) => state.auth.user)
  const { toast } = useToast()

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (!post.title.trim()) {
      newErrors.title = 'Title is required'
    }
    
    if (!post.content.trim()) {
      newErrors.content = 'Content is required'
    } else if (post.content.trim().length < 25) {
      newErrors.content = 'Content must be at least 25 characters long'
    }
    
    if (!post.excerpt.trim()) {
      newErrors.excerpt = 'Excerpt is required'
    } else if (post.excerpt.length > 160) {
      newErrors.excerpt = 'Excerpt should be 160 characters or less'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  useEffect(() => {
    if (postId) {
      // Fetch the post data from API
      const fetchPost = async () => {
        try {
          const data = await getBlogPost(postId)
          setPost(data)
        } catch (error) {
          console.error("Error fetching post:", error)
        }
      }
      fetchPost()
    }
  }, [postId])

  const handleChange = (field: keyof BlogPost, value: string) => {
    setPost((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async (newStatus?: "draft" | "published") => {
    // Always validate required fields, regardless of draft or publish
    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: newStatus === 'published' 
          ? 'Please fix the errors before publishing' 
          : 'Please fill in all required fields',
        variant: 'error',
      })
      return
    }
    
    setIsSaving(true)

    try {
      const blogData = {
        title: post.title.trim(),
        content: post.content.trim(),
        excerpt: post.excerpt.trim(),
        author: user?._id,
        image: post.image,
        category: post.category,
        status: newStatus || post.status,
      }

     

      if (postId) {
        await updateBlogPost(postId, blogData)
      } else {
        await createBlogPost(blogData)
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
      await deleteBlogPost(postId as string)
      router.push("/blog")
    } catch (error) {
      console.error("Error deleting post:", error)
    }
  }

  const handleImageUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)

    const reader = new FileReader()
    reader.onloadend = async () => {
      try {
        const imageFormat = file.type.split("/")[1]
        const imageData = {
          data: reader.result,
          format: imageFormat,
        }

        const objectUrl = await getUploadFileUrl(user?._id as string, imageData)
        if (objectUrl) {
          handleChange("image", objectUrl)
          toast({
            title: "Image uploaded",
            description: "Your image has been uploaded successfully.",
            variant: "success",
          })
        }
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to upload image. Try again.",
          variant: "error",
        })
      } finally {
        setIsUploading(false)
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <Label htmlFor="post-title">Title</Label>
          <Input
            id="post-title"
            value={post.title}
            onChange={(e) => {
              handleChange("title", e.target.value)
              clearError('title')
            }}
            placeholder="Enter post title"
            className={`max-w-2xl ${errors.title ? 'border-red-500' : ''}`}
          />
          {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title}</p>}
        </div>
        <div className="flex items-center gap-2 mt-6">

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
          <Textarea
            value={post.content}
            onChange={(e) => {
              handleChange("content", e.target.value)
              clearError('content')
            }}
            placeholder="Write your blog post content here..."
            className={`min-h-[400px] ${errors.content ? 'border-red-500' : ''}`}
          />
          {errors.content && <p className="text-sm text-red-500 mt-1">{errors.content}</p>}
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
            <div className="mt-2">
              <Button 
                type="button" 
                onClick={handleImageUploadClick} 
                className="w-full"
                disabled={isUploading}
              >
                {isUploading ? "Uploading..." : "Upload Image"}
              </Button>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="post-category">Category</Label>
            <Select value={post.category} onValueChange={(value) =>{
               handleChange("category", value)}}>
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
