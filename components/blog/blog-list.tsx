"use client"

import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Heart, MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Image from "next/image"
import Link from "next/link"

// Updated with realistic legal blog post data
const blogPosts = [
  {
    id: 1,
    title: "Recent Changes to Family Law in 2025",
    excerpt:
      "An overview of the most significant changes to family law this year and how they might affect your clients.",
    image: "/placeholder.svg?height=200&width=400",
    date: "Mar 24, 2025",
    status: "published",
    likes: 24,
  },
  {
    id: 2,
    title: "Navigating Intellectual Property in the AI Era",
    excerpt: "How artificial intelligence is changing intellectual property law and what practitioners need to know.",
    image: "/placeholder.svg?height=200&width=400",
    date: "Mar 20, 2025",
    status: "published",
    likes: 18,
  },
  {
    id: 3,
    title: "The Impact of Remote Work on Employment Law",
    excerpt: "Examining how the shift to remote work has created new challenges and considerations in employment law.",
    image: "/placeholder.svg?height=200&width=400",
    date: "Mar 15, 2025",
    status: "draft",
    likes: 0,
  },
  {
    id: 4,
    title: "Understanding the New Data Privacy Regulations",
    excerpt: "A comprehensive guide to the latest data privacy regulations and compliance requirements for law firms.",
    image: "/placeholder.svg?height=200&width=400",
    date: "Mar 10, 2025",
    status: "published",
    likes: 12,
  },
  {
    id: 5,
    title: "Estate Planning Strategies for Digital Assets",
    excerpt:
      "How to help clients properly include cryptocurrencies, NFTs, and other digital assets in their estate plans.",
    image: "/placeholder.svg?height=200&width=400",
    date: "Mar 5, 2025",
    status: "published",
    likes: 8,
  },
  {
    id: 6,
    title: "The Future of Legal Technology: 2025 and Beyond",
    excerpt: "Exploring emerging technologies that will shape the practice of law in the coming years.",
    image: "/placeholder.svg?height=200&width=400",
    date: "Feb 28, 2025",
    status: "draft",
    likes: 0,
  },
]

export default function BlogList() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {blogPosts.map((post, index) => (
        <Card key={post.id} className={`overflow-hidden ${index % 2 === 0 ? "bg-gray-100" : "bg-white"}`}>
          <div className="relative h-48 w-full">
            <Image src={post.image || "/placeholder.svg"} alt={post.title} fill className="object-cover" />
          </div>
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-semibold">{post.title}</h3>
              <Badge variant={post.status === "published" ? "default" : "outline"}>
                {post.status === "published" ? "Published" : "Draft"}
              </Badge>
            </div>
            <p className="text-sm text-gray-500">{post.excerpt}</p>
          </CardContent>
          <CardFooter className="p-4 pt-0 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Heart className="h-4 w-4" />
              </Button>
              <span className="text-sm text-gray-500">{post.likes}</span>
              <span className="text-sm text-gray-500 ml-2">{post.date}</span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/blog/${post.id}`}>Edit</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/blog/${post.id}/preview`}>Preview</Link>
                </DropdownMenuItem>
                <DropdownMenuItem>{post.status === "published" ? "Unpublish" : "Publish"}</DropdownMenuItem>
                <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
