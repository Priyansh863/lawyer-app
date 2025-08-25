"use client"

import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Heart, MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Image from "next/image"
import Link from "next/link"
import { useState, useEffect } from "react";
import { getBlogPosts, deleteBlogPost, BlogPost } from "@/lib/api/blog-api";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

interface BlogListProps {
  searchQuery?: string
  categoryFilter?: string
  statusFilter?: string
}

export default function BlogList({ searchQuery = "", categoryFilter = "all", statusFilter = "all" }: BlogListProps) {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalBlogs: 0,
    hasNext: false,
    hasPrev: false
  });

  useEffect(() => {
    const fetchBlogs = async () => {
      setIsLoading(true);
      try {
        const params: any = {
          page: 1,
          limit: 12
        };
        
        if (searchQuery) params.search = searchQuery;
        if (categoryFilter !== "all") params.category = categoryFilter;
        if (statusFilter !== "all") params.status = statusFilter;
        
        const response:any = await getBlogPosts(params);
        setBlogs(response.blogs);
        setPagination(response.pagination);
      } catch (error) {
        console.error("Error fetching blogs:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBlogs();
  }, [searchQuery, categoryFilter, statusFilter]);

  const handleDelete = async (_id: string) => {
    if (confirm("Are you sure you want to delete this blog?")) {
      try {
        await deleteBlogPost(_id);
        setBlogs(blogs.filter(blog => blog._id !== _id));
      } catch (error) {
        alert("Failed to delete blog");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className={`overflow-hidden ${index % 2 === 0 ? "bg-gray-100" : "bg-white"}`}>
            <div className="relative h-48 w-full">
              <Skeleton height={192} />
            </div>
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <Skeleton width={120} height={24} />
                <Skeleton width={80} height={24} />
              </div>
              <Skeleton count={2} />
            </CardContent>
            <CardFooter className="p-4 pt-0 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Skeleton width={80} height={20} />
              </div>
              <Skeleton circle width={32} height={32} />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {blogs.map((post, index) => (
        <Card key={post._id} className={`overflow-hidden ${index % 2 === 0 ? "bg-gray-100" : "bg-white"}`}>
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
              <span className="text-sm text-gray-500 ml-2">{new Date(post.createdAt).toLocaleDateString()}</span>
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
                  <Link href={`/blog/${post._id}`}>Edit</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDelete(post._id)}>Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}