"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Search, 
  Bookmark, 
  User, 
  Calendar,
  Hash,
  Loader2,
  RefreshCw,
  BookmarkX
} from "lucide-react";
import { getAllBookmarkedPosts, toggleBookmark } from "@/lib/api/bookmark-api";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
import { Post } from "@/lib/api/posts-api";
import Link from "next/link";
import { post } from "@/lib/http";
// Helper function to format dates
const formatDistanceToNow = (date: Date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;
  return `${Math.floor(diffInSeconds / 31536000)} years ago`;
};

interface BookmarkData {
  _id: string;
  post: Post;
  createdAt: string;
}

interface BookmarksResponse {
  success: boolean;
  data: {
    bookmarks: BookmarkData[];
    totalCount: number;
  };
}

function BookmarkPostsContent() {
  const [bookmarks, setBookmarks] = useState<BookmarkData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [totalBookmarks, setTotalBookmarks] = useState(0);
  const { toast } = useToast();
  const { t } = useTranslation();

  // Fetch bookmarks
  const fetchBookmarks = async (page: number = 1, isRefresh: boolean = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await getAllBookmarkedPosts();
      
      if (response.success) {
        setBookmarks(response.data.bookmarks);
        setTotalBookmarks(response.data.totalCount);
      }
    } catch (error: any) {
      toast({
        title: t("pages:bookmarks.error") || "Error",
        description: error.message || t("pages:bookmarks.fetchError") || "Failed to fetch bookmarks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Remove bookmark
  const handleRemoveBookmark = async (postId: string) => {
    try {
      await toggleBookmark(postId);
      
      // Remove from local state
      setBookmarks(prev => prev.filter(bookmark => bookmark.post._id !== postId));
      setTotalBookmarks(prev => prev - 1);
      
      toast({
        title: t("pages:bookmarks.removed") || "Bookmark Removed",
        description: t("pages:bookmarks.removedDesc") || "Post has been removed from your bookmarks",
      });
    } catch (error: any) {
      toast({
        title: t("pages:bookmarks.error") || "Error",
        description: error.message || t("pages:bookmarks.removeError") || "Failed to remove bookmark",
        variant: "destructive",
      });
    }
  };

  // Filter bookmarks based on search
  const filteredBookmarks = bookmarks.filter(bookmark => {
    const searchLower = searchQuery.toLowerCase();
    return (
      bookmark.post.title.toLowerCase().includes(searchLower) ||
      bookmark.post.content.toLowerCase().includes(searchLower) ||
      bookmark.post.hashtag?.toLowerCase().includes(searchLower) ||
      `${bookmark.post.author.first_name} ${bookmark.post.author.last_name}`.toLowerCase().includes(searchLower)
    );
  });

  // Load bookmarks on mount
  useEffect(() => {
    fetchBookmarks();
  }, []);

  // Format post content preview
  const getContentPreview = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + "...";
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">{t("pages:bookmarks.loading") || "Loading bookmarks..."}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Bookmark className="h-8 w-8 text-blue-600" />
              {t("pages:bookmarks.title") || "Bookmarked Posts"}
            </h1>
            <p className="text-gray-600 mt-2">
              {t("pages:bookmarks.description") || "View and manage your saved posts"}
            </p>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <span>{totalBookmarks} {t("pages:bookmarks.totalBookmarks") || "bookmarks"}</span>
            </div>
          </div>
          <Button
            onClick={() => fetchBookmarks(1, true)}
            disabled={refreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? (t("pages:bookmarks.refreshing") || "Refreshing...") : (t("pages:bookmarks.refresh") || "Refresh")}
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder={t("pages:bookmarks.searchPlaceholder") || "Search bookmarks..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Bookmarks List */}
      {filteredBookmarks.length === 0 ? (
        <div className="text-center py-12">
          <Bookmark className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery ? 
              (t("pages:bookmarks.noSearchResults") || "No bookmarks found") :
              (t("pages:bookmarks.noBookmarks") || "No bookmarks yet")
            }
          </h3>
          <p className="text-gray-500">
            {searchQuery ? 
              (t("pages:bookmarks.noSearchResultsDesc") || "Try different search terms") :
              (t("pages:bookmarks.noBookmarksDesc") || "Start bookmarking posts to see them here")
            }
          </p>
          {searchQuery && (
            <Button
              onClick={() => setSearchQuery("")}
              variant="outline"
              className="mt-4"
            >
              {t("pages:bookmarks.clearSearch") || "Clear Search"}
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookmarks.map((bookmark) => (
            <Card key={bookmark._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {/* Author Avatar */}
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={bookmark.post.author.avatar} />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>

                  {/* Post Content */}
                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="font-medium">
                          {bookmark.post.author.first_name} {bookmark.post.author.last_name}
                        </span>
                        <span>•</span>
                        <Calendar className="h-3 w-3" />
                        <span>
                          {formatDistanceToNow(new Date(bookmark.post.createdAt))}
                        </span>
                        {bookmark.post.isAiGenerated && (
                          <>
                            <span>•</span>
                            <Badge variant="secondary" className="text-xs">
                              AI Generated
                            </Badge>
                          </>
                        )}
                      </div>
                      
                      {/* Remove Bookmark Button */}
                      <Button
                        onClick={() => handleRemoveBookmark(bookmark.post._id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <BookmarkX className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Title */}
                    <h3 className="font-semibold text-lg mb-2 text-gray-900">
                      {bookmark.post.title}
                    </h3>

                    {/* Content Preview */}
                    <p className="text-gray-600 mb-3 leading-relaxed">
                      {getContentPreview(bookmark.post.content)}
                    </p>

                    {/* Image */}
                    {bookmark.post.image && (
                      <div className="mb-3">
                        <img
                          src={bookmark.post.image}
                          alt={bookmark.post.title}
                          className="w-full max-w-md h-48 object-cover rounded-lg border"
                        />
                      </div>
                    )}

                    {/* Hashtags */}
                    {bookmark.post.hashtag && (
                      <div className="mb-3">
                        <div className="flex items-center gap-1 text-blue-600">
                          <Hash className="h-3 w-3" />
                          <span className="text-sm">{bookmark.post.hashtag.replace('#', '')}</span>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <p
                        onClick={() => window.open(bookmark.post.customUrl, '_blank')}
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          {t("pages:bookmarks.viewPost") || "View Post"}
                        </p>
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        {t("pages:bookmarks.bookmarkedOn") || "Bookmarked"} {formatDistanceToNow(new Date(bookmark.createdAt))}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Note: No pagination needed since we fetch all bookmarked posts */}
    </div>
  );
}

export default function BookmarkPostsPage() {
  return (
    <DashboardLayout>
      <BookmarkPostsContent />
    </DashboardLayout>
  );
}