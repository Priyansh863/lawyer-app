import BlogHeader from "@/components/blog/blog-header"
import BlogList from "@/components/blog/blog-list"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Blog | Legal Practice Management",
  description: "Create and manage blog content for your legal practice",
}

export default function BlogPage() {
  return (
    <div className="space-y-6">
      <BlogHeader />
      <BlogList />
    </div>
  )
}
