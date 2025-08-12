"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  Eye, 
  Share2, 
  BookOpen,
  Clock
} from 'lucide-react';
import axios from 'axios';

interface Blog {
  createdAt: string;
  _id: string;
  title: string;
  content: string;
  category: string;
  user_id: {
    _id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  views?: number;
  created_at: string;
  updated_at: string;
}

interface RelatedBlog {
  createdAt: string;
  _id: string;
  title: string;
  category: string;
  created_at: string;
  user_id: {
    first_name: string;
    last_name: string;
  };
}

export default function BlogDetailPage() {
  const params = useParams();
  const router = useRouter();
  const blogId = params.id as string;

  const [blog, setBlog] = useState<Blog | null>(null);
  const [relatedBlogs, setRelatedBlogs] = useState<RelatedBlog[]>([]);
  const [loading, setLoading] = useState(true);
  const [relatedLoading, setRelatedLoading] = useState(false);

  useEffect(() => {
    if (blogId) {
      fetchBlog();
      incrementViews();
    }
  }, [blogId]);

  const fetchBlog = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/blog/${blogId}`
      );

      if (response.data.success) {
        setBlog(response.data.data);
        fetchRelatedBlogs();
      } else {
        toast({
          title: "Error",
          description: "Blog not found",
          variant: "destructive"
        });
        router.push('/blog');
      }
    } catch (error) {
      console.error('Error fetching blog:', error);
      toast({
        title: "Error",
        description: "Failed to load blog",
        variant: "destructive"
      });
      router.push('/blog');
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedBlogs = async () => {
    setRelatedLoading(true);
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/blog/${blogId}/related?limit=5`
      );

      if (response.data.success) {
        setRelatedBlogs(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching related blogs:', error);
    } finally {
      setRelatedLoading(false);
    }
  };

  const incrementViews = async () => {
    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/blog/${blogId}/views`
      );
    } catch (error) {
      console.error('Error incrementing views:', error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: blog?.title,
          text: `Check out this blog: ${blog?.title}`,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link Copied",
        description: "Blog link copied to clipboard"
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getReadingTime = (content: string) => {
    const wordsPerMinute = 200;
    const wordCount = content.split(' ').length;
    const readingTime = Math.ceil(wordCount / wordsPerMinute);
    return readingTime;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Blog Not Found</h1>
          <Button onClick={() => router.push('/blog')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Blogs
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/blog')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Blogs
          </Button>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <div className="space-y-4">
              <CardTitle className="text-3xl font-bold leading-tight">
                {blog.title}
              </CardTitle>
              
              {/* Meta Information */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(blog.createdAt)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{getReadingTime(blog.content)} min read</span>
                </div>
                {blog.views && (
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    <span>{blog.views} views</span>
                  </div>
                )}
              </div>

              {/* Category */}
              <div className="flex flex-wrap items-center gap-2">
                {blog.category && (
                  <Badge variant="default">
                    {blog.category}
                  </Badge>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button onClick={handleShare} variant="outline" size="sm">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <Separator className="mb-6" />
            
            {/* Blog Content */}
            <div className="prose prose-lg max-w-none">
              <div 
                className="whitespace-pre-wrap leading-relaxed text-gray-800"
                dangerouslySetInnerHTML={{ __html: blog.content.replace(/\n/g, '<br />') }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Related Blogs */}
        {relatedBlogs.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Related Blogs
              </CardTitle>
            </CardHeader>
            <CardContent>
              {relatedLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {relatedBlogs.map((relatedBlog) => (
                    <div 
                      key={relatedBlog._id} 
                      className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => router.push(`/blog/${relatedBlog._id}`)}
                    >
                      <h3 className="font-semibold text-lg mb-2 hover:text-blue-600">
                        {relatedBlog.title}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>{formatDate(relatedBlog.createdAt)}</span>
                        <Badge variant="outline">{relatedBlog.category}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
