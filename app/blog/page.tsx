"use client"

import { useState } from "react"
import BlogHeader from "@/components/blog/blog-header"
import BlogList from "@/components/blog/blog-list"

export default function BlogPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  return (
    <div className="space-y-6">
      <BlogHeader 
        onSearch={setSearchQuery}
        onCategoryFilter={setCategoryFilter}
        onStatusFilter={setStatusFilter}
        searchQuery={searchQuery}
        selectedCategory={categoryFilter}
        selectedStatus={statusFilter}
      />
      <BlogList 
        searchQuery={searchQuery}
        categoryFilter={categoryFilter}
        statusFilter={statusFilter}
      />
    </div>
  )
}
