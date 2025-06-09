import BlogEditor from "@/components/blog/blog-editor"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Edit Blog Post | Legal Practice Management",
  description: "Edit your legal blog post",
}

export default function EditBlogPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Edit Blog Post</h1>
      <BlogEditor postId={params.id} />
    </div>
  )
}
