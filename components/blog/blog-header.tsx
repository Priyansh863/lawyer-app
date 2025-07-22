"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlusCircle, Search } from "lucide-react"
import { useRouter } from "next/navigation"

interface BlogHeaderProps {
  onSearch?: (query: string) => void
  onCategoryFilter?: (category: string) => void
  onStatusFilter?: (status: string) => void
  searchQuery?: string
  selectedCategory?: string
  selectedStatus?: string
}

export default function BlogHeader({
  onSearch,
  onCategoryFilter,
  onStatusFilter,
  searchQuery = "",
  selectedCategory = "all",
  selectedStatus = "all"
}: BlogHeaderProps) {
  const router = useRouter()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Blog</h1>
          <p className="text-sm text-gray-500">Manage your legal blog content</p>
        </div>
        <Button onClick={() => router.push("/blog/new")} className="flex items-center gap-2">
          <PlusCircle size={16} />
          <span>New Post</span>
        </Button>
      </div>
      
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search blog posts..."
            value={searchQuery}
            onChange={(e) => onSearch?.(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={selectedCategory} onValueChange={onCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="legal-advice">Legal Advice</SelectItem>
            <SelectItem value="case-studies">Case Studies</SelectItem>
            <SelectItem value="news">News</SelectItem>
            <SelectItem value="insights">Insights</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={selectedStatus} onValueChange={onStatusFilter}>
          <SelectTrigger className="w-full sm:w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
