import BlogEditor from "@/components/blog/blog-editor"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "New Blog Post | Legal Practice Management",
  description: "Create a new blog post for your legal practice",
}

export default function NewBlogPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Create New Blog Post</h1>
      <BlogEditor />
    </div>
  )
}
