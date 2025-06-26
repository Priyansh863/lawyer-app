"use client"

import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Heart, MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Image from "next/image"
import Link from "next/link"
import { useState, useEffect } from "react";
import { getBlogPosts, deleteBlogPost } from "@/lib/api/blog-api";

// Define the BlogPost interface
interface BlogPost {
  _id: string;
  image: string;
  title: string;
  status: string;
  excerpt: string;
  likes: number;
  date: string;
}

export default function BlogList() {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const data = await getBlogPosts();
        setBlogs(data);
      } catch (error) {
        console.error("Error fetching blogs:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBlogs();
  }, []);

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
    return <div>Loading...</div>;
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
                  <Link href={`/blog/${post._id}`}>Edit</Link>
                </DropdownMenuItem>
                {/* <DropdownMenuItem asChild>
                  <Link href={`/blog/${post._id}/preview`}>Preview</Link>
                </DropdownMenuItem> */}
                <DropdownMenuItem onClick={() => handleDelete(post._id)}>Delete</DropdownMenuItem>
                <DropdownMenuItem>{post.status === "published" ? "Unpublish" : "Publish"}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
