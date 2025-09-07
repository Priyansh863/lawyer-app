"use client";

import DashboardLayout from "@/components/layouts/dashboard-layout"
import DashboardHeader from "@/components/dashboard/dashboard-header"
import StatsCards from "@/components/dashboard/stats-cards"
import QuickActions from "@/components/dashboard/quick-actions"
import { useSelector } from "react-redux"
import { RootState } from "@/lib/store"
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { 
  getPosts, 
  type Post 
} from "@/lib/api/posts-api";
import { 
  User, 
  ExternalLink, 
  ChevronDown, 
  ChevronUp, 
  Calendar, 
  Tag,
  Link as LinkIcon,
  FileText,
  Clock,
  Globe
} from "lucide-react";

export default function ProfessionalDashboardPage() {
  const profile = useSelector((state: RootState) => state.auth.user);
  const { toast } = useToast();
  const { t } = useTranslation();
  
  // Posts state
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());

  // Fetch posts
  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      const response = await getPosts(1, 8, "published","dashboard");
      
      setPosts(response.data.posts || []);
    } catch (error: any) {
      toast({
        title: t("pages:posts.fetchPostsError"),
        description: error.message || t("pages:posts.somethingWentWrong"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load posts on component mount
  useEffect(() => {
    fetchPosts();
  }, []);

  // Toggle post expansion
  const togglePostExpansion = (postId: string) => {
    const newExpanded = new Set(expandedPosts);
    if (newExpanded.has(postId)) {
      newExpanded.delete(postId);
    } else {
      newExpanded.add(postId);
    }
    setExpandedPosts(newExpanded);
  };

  // Helper function to check if post has an image
  const hasImage = (post: Post) => {
    return post.image && post.image.trim() !== "";
  };

  // Helper function to format content
  const formatContent = (content: string, isExpanded: boolean) => {
    if (!content) return "";
    
    if (isExpanded) {
      return content;
    }
    
    return content.length > 400 ? content.substring(0, 400) + "..." : content;
  };

  // Helper function to get author avatar
  const getAuthorAvatar = (author: any) => {
    if (author?.avatar) {
      return author.avatar;
    }
    return null;
  };

  // Professional post card component
  const PostCard = ({ post }: { post: Post }) => {
    const isExpanded = expandedPosts.has(post._id);
    const hasLongContent = post.content && post.content.length > 400;

    return (
      <Card className="w-full bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
        {/* Post Header */}
        <div className="p-6 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="relative">
                {getAuthorAvatar(post.author) ? (
                  <img
                    src={getAuthorAvatar(post.author)}
                    alt={`${post.author?.first_name} ${post.author?.last_name}`}
                    className="w-12 h-12 rounded-full object-cover border-2 border-gray-100"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h3 className="font-semibold text-gray-900 text-sm">
                    {post.author ? `${post.author.first_name} ${post.author.last_name}` : "Unknown Author"}
                  </h3>
                  <Badge variant="secondary" className="text-xs px-2 py-0.5">
                    {post.author?.account_type || "User"}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {new Date(post.createdAt).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  <span>•</span>
                  <Badge variant={post.status === 'published' ? 'default' : 'secondary'} className="text-xs">
                    {post.status}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                <FileText className="h-3 w-3 mr-1" />
                Legal Post
              </Badge>
            </div>
          </div>

          {/* Post Title */}
          <h2 className="text-xl font-bold text-gray-900 mb-4 leading-tight">
            {post.title}
          </h2>
          
          {/* Post Content */}
          <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap mb-4">
            {formatContent(post.content || "", isExpanded)}
          </div>

          {hasLongContent && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => togglePostExpansion(post._id)}
              className="mb-4 p-0 h-auto text-blue-600 hover:text-blue-700 font-medium"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  Read more
                </>
              )}
            </Button>
          )}
        </div>

        {/* Post Image */}
        {hasImage(post) && (
          <div className="px-6 pb-4">
            <div className="rounded-xl overflow-hidden bg-gray-100">
              <img
                src={post.image}
                alt={post.title}
                className="w-full h-auto max-h-96 object-cover"
              />
            </div>
          </div>
        )}

        {/* Hashtags */}
        {post.hashtags && post.hashtags.length > 0 && (
          <div className="px-6 pb-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
              <Tag className="h-4 w-4 mr-2" />
              Tags
            </h4>
            <div className="flex flex-wrap gap-2">
              {post.hashtags.map((hashtag, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="text-blue-600 border-blue-200 hover:bg-blue-50 cursor-pointer transition-colors"
                >
                  {hashtag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Useful Links */}
        {post.usefulLinks && post.usefulLinks.length > 0 && (
          <div className="px-6 pb-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
              <LinkIcon className="h-4 w-4 mr-2" />
              Legal Resources
            </h4>
            <div className="space-y-3">
              {post.usefulLinks.map((link, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-gray-300 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900 text-sm mb-1">
                        {link.title}
                      </h5>
                      {link.description && (
                        <p className="text-gray-600 text-xs mb-3">
                          {link.description}
                        </p>
                      )}
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 text-xs font-medium inline-flex items-center bg-blue-50 px-2 py-1 rounded"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Visit Resource
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Share Links */}
        {(post.customUrl || post.shortUrl) && (
          <div className="px-6 pb-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
              <Globe className="h-4 w-4 mr-2" />
              Share Links
            </h4>
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="space-y-3">
                {post.customUrl && (
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">Custom URL</label>
                    <div className="flex items-center justify-between bg-white rounded p-2 border">
                      <span className="text-xs text-gray-600 truncate flex-1 mr-2">
                        {post.customUrl}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => navigator.clipboard.writeText(post.customUrl)}
                      >
                        Copy
                      </Button>
                    </div>
                  </div>
                )}
                {post.shortUrl && (
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">Short URL</label>
                    <div className="flex items-center justify-between bg-white rounded p-2 border">
                      <span className="text-xs text-gray-600 truncate flex-1 mr-2">
                        {post.shortUrl}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => navigator.clipboard.writeText(post.shortUrl)}
                      >
                        Copy
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Post Metadata Footer */}
        <div className="border-t border-gray-100 px-6 py-4 bg-gray-50">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-4">
              <span className="flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                Created: {new Date(post.createdAt).toLocaleDateString('ko-KR')}
              </span>
              {post.updatedAt && post.updatedAt !== post.createdAt && (
                <span className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  Updated: {new Date(post.updatedAt).toLocaleDateString('ko-KR')}
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        <DashboardHeader />
        <StatsCards />
        
        {profile?.account_type === "lawyer" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <QuickActions />
          </div>
        )}

        {/* Professional Posts Feed */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Legal Posts</h2>
              <p className="text-gray-600 text-sm mt-1">Professional legal content and resources</p>
            </div>
            <Badge variant="secondary" className="px-3 py-1">
              {posts.length} posts
            </Badge>
          </div>
          
          {isLoading ? (
            <div className="space-y-6">
              {Array.from({ length: 3 }).map((_, index) => (
                <Card key={index} className="p-6 border-0 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <Skeleton circle width={48} height={48} />
                    <div className="flex-1">
                      <Skeleton width={150} height={16} />
                      <Skeleton width={100} height={12} className="mt-2" />
                    </div>
                  </div>
                  <Skeleton count={4} className="mb-4" />
                  <Skeleton height={200} className="rounded-xl" />
                </Card>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <Card className="border-0 shadow-none bg-gray-50/50">
              <CardContent className="text-center py-16">
                <div className="text-gray-300 text-6xl mb-4">⚖️</div>
                <h3 className="text-lg font-normal text-gray-600 mb-2">No legal posts yet</h3>
                <p className="text-gray-400 text-sm">
                  Start sharing your legal expertise with the community
                </p>
                <Button className="mt-4" variant="outline">
                  Create your first post
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {posts.map((post) => (
                <PostCard key={post._id} post={post} />
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
