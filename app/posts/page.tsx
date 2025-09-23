"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

import PostCreator from "@/components/posts/post-creator";
import QrCodeGenerator from "@/components/posts/qr-code-generator";
import { 
  getPosts, 
  type Post 
} from "@/lib/api/posts-api";
import { 
  FileText, 
  Plus, 
  Share2, 
  Copy,
  Calendar,
  User,
  MapPin,
  Hash,
  Wand2,
  QrCode,
  ChevronDown,
  ChevronUp,
  ExternalLink
} from "lucide-react";

export default function PostsPage() {
  const { toast } = useToast();
  const { t } = useTranslation();
  
  // State
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch posts
  const fetchPosts = async (page = 1) => {
    try {
      setIsLoading(true);
      const response = await getPosts(page, 10, "published");
      
      setPosts(response.data.posts || []);
      setTotalPages(response.data.totalPages || 1);
      setCurrentPage(page);
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
    fetchPosts(1);
  }, []);

  // Handle post creation
  const handlePostCreated = (post: Post) => {
    setPosts(prev => [post, ...prev]);
    toast({
      title: t("pages:posts.postCreated"),
      description: t("pages:posts.postAddedToList"),
      variant: "default",
    });
  };

  // Copy URL to clipboard
  const copyUrl = (url: string, type: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: t("urlCopied"),
      description: t("pages:posts.urlCopiedToClipboard", { type }),
      variant: "default",
    });
  };

  // Open URL in new tab
  const openUrl = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Toggle post expansion
  const toggleExpandPost = (postId: string) => {
    setExpandedPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Skeleton components
  const PostRowSkeleton = () => (
    <Card className="hover:shadow-md transition-shadow mb-4">
      <CardContent className="p-4">
        <div className="flex">
          {/* Avatar placeholder */}
          <div className="mr-4">
            <Skeleton width={48} height={48} circle />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center mb-1 flex-wrap">
              <Skeleton width={120} height={16} className="mr-2 mb-1" />
              <Skeleton width={80} height={14} />
            </div>
            
            <Skeleton count={3} height={16} className="mb-2" />
            
            {/* Image placeholder */}
            <Skeleton height={200} className="rounded-lg mb-2" />
            
            <div className="flex flex-wrap gap-2 mt-3">
              <Skeleton width={80} height={32} />
              <Skeleton width={80} height={32} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 mt-7">
      <div className="px-4 sm:px-6 py-4 border-b">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          {t("pages:posts.postsContentTitle")}
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
          {t("pages:posts.postsContentDescription")}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
        <TabsList className="grid w-full grid-cols-2 mx-4 sm:mx-6">
          <TabsTrigger value="list" className="flex items-center gap-2 text-xs sm:text-sm">
            <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
            {t("pages:posts.myPosts")}
          </TabsTrigger>
          <TabsTrigger value="create" className="flex items-center gap-2 text-xs sm:text-sm">
            <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
            {t("pages:posts.createNew")}
          </TabsTrigger>
        </TabsList>

        {/* Posts List */}
        <TabsContent value="list" className="space-y-6 px-4 sm:px-6">
          {/* Posts List - Twitter style rows */}
          {isLoading ? (
            <div className="space-y-4">
              <PostRowSkeleton />
              <PostRowSkeleton />
              <PostRowSkeleton />
            </div>
          ) : posts.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <FileText className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">{t("pages:posts:noPostsFound")}</h3>
                <p className="text-sm sm:text-base text-gray-600 mb-4">
                  {t("pages:posts.noPostsCreatedYet")}
                </p>
                <Button onClick={() => setActiveTab('create')} className="text-xs sm:text-sm">
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  {t("pages:posts.createFirstPost")}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => {
                const isExpanded = expandedPosts.has(post._id);
                const contentPreview = post.content.length > 300 && !isExpanded 
                  ? post.content.substring(0, 300) + '...' 
                  : post.content;
                  
                return (
                <Card key={post._id} className="hover:shadow-md transition-shadow overflow-hidden">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex">
                      {/* Author Avatar */}
                      <div className="mr-3 sm:mr-4 flex-shrink-0">
                        <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-gray-200 flex items-center justify-center">
                          <User className="h-4 w-4 sm:h-6 sm:w-6 text-gray-500" />
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        {/* Author info and timestamp */}
                        <div className="flex items-center mb-1 flex-wrap">
                          <span className="font-semibold text-gray-900 truncate text-sm sm:text-base">
                            {post.author.first_name} {post.author.last_name}
                          </span>
                          <span className="mx-1 sm:mx-2 text-gray-500 text-xs sm:text-sm">·</span>
                          <span className="text-xs sm:text-sm text-gray-500 whitespace-nowrap">
                            {formatDate(post.createdAt)}
                          </span>
                        </div>
                        
                        {/* Post title */}
                        <h3 className="font-bold text-base sm:text-lg mb-2 break-words">{post.title}</h3>
                        
                        {/* Post content with read more/less */}
                        <div className="text-gray-800 mb-3 text-sm sm:text-base">
                          <div 
                            className="break-words"
                            dangerouslySetInnerHTML={{
                              __html: contentPreview
                                .replace(/\n/g, '<br>')
                                .replace(/### (.*?)\n/g, '<h3 class="text-sm sm:text-base font-bold mt-3 mb-2 break-words">$1</h3>')
                                .replace(/#### (.*?)\n/g, '<h4 class="text-xs sm:text-sm font-semibold mt-2 mb-1 break-words">$1</h4>')
                                .replace(/\*\*(.*?)\*\*/g, '<strong class="break-words">$1</strong>')
                                .replace(/- (.*?)\n/g, '<li class="ml-4 mb-1 break-words">$1</li>')
                            }}
                          />
                          
                          {post.content.length > 300 && (
                            <Button 
                              variant="link" 
                              className="p-0 h-auto text-blue-500 hover:text-blue-700 text-xs sm:text-sm"
                              onClick={() => toggleExpandPost(post._id)}
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                  {t("pages:posts.showless")}
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                  {t("pages:posts.readmore")}
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                        
                        {/* Post Image */}
                        {post.image && (
                          <div className="mb-3 rounded-lg overflow-hidden border">
                            <img
                              src={post.image}
                              alt={post.title}
                              className="w-full h-auto max-h-48 sm:max-h-96 object-cover"
                            />
                          </div>
                        )}
                        
                        {/* Badges */}
                        <div className="flex flex-wrap gap-1 sm:gap-2 mb-3">
                          {post.isAiGenerated && (
                            <Badge variant="outline" className="flex items-center gap-1 text-xs">
                              <Wand2 className="h-3 w-3" />
                              <span className="hidden xs:inline">{t("pages:posts.aiGenerated")}</span>
                              <span className="xs:hidden">AI</span>
                            </Badge>
                          )}
                          {post.spatialInfo?.latitude && (
                            <Badge variant="outline" className="flex items-center gap-1 text-xs">
                              <MapPin className="h-3 w-3" />
                              <span className="hidden xs:inline">{t("pages:posts.location")}</span>
                              <span className="xs:hidden">Loc</span>
                            </Badge>
                          )}
                        </div>
                        
                        {/* Hashtags */}
                        {(post.hashtags && post.hashtags.length > 0) ? (
                          <div className="flex items-center gap-1 flex-wrap mb-3">
                            <Hash className="h-3 w-3 text-blue-500 flex-shrink-0" />
                            <div className="flex flex-wrap gap-1">
                              {post.hashtags.map((tag, index) => (
                                <span key={index} className="text-xs sm:text-sm text-blue-500 break-words">
                                  {tag}{index < post.hashtags!.length - 1 ? ', ' : ''}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : post.hashtag && (
                          <div className="flex items-center gap-1 mb-3 flex-wrap">
                            <Hash className="h-3 w-3 text-blue-500 flex-shrink-0" />
                            <span className="text-xs sm:text-sm text-blue-500 break-words">{post.hashtag}</span>
                          </div>
                        )}
                        
                        {/* Citations */}
                        {post.citations && post.citations.length > 0 && (
                          <div className="text-xs text-gray-500 mb-3">
                            {post.citations.length} {t("pages:posts.citation", { count: post.citations.length })}
                          </div>
                        )}
                        
                        {/* Useful links */}
                        {post.usefulLinks && post.usefulLinks.length > 0 && (
                          <div className="space-y-1 mb-3">
                            <div className="text-xs font-medium text-gray-700">{t("pages:posts.usefulResources")}:</div>
                            {post.usefulLinks.slice(0, 2).map((link, index) => (
                              <div key={index} className="text-xs break-words">
                                <a 
                                  href={link.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 underline break-all"
                                >
                                  {link.title}
                                </a>
                                {link.description && (
                                  <span className="text-gray-500 ml-1 hidden sm:inline">- {link.description}</span>
                                )}
                              </div>
                            ))}
                            {post.usefulLinks.length > 2 && (
                              <div className="text-xs text-gray-500">+{post.usefulLinks.length - 2} {t("pages:posts.moreResources")}</div>
                            )}
                          </div>
                        )}
                        
                        {/* Action buttons */}
                        <div className="flex flex-col sm:flex-row sm:justify-between mt-4 pt-3 border-t gap-2 sm:gap-0">
                          <div className="flex flex-wrap gap-1 sm:gap-2">
                            {post.customUrl && (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => copyUrl(post.customUrl!, t("pages:posts.custom"))}
                                  className="text-gray-500 hover:text-purple-500 text-xs h-8 px-2"
                                >
                                  <Copy className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                  <span className="hidden sm:inline">{t("pages:posts.copyUrl")}</span>
                                  <span className="sm:hidden">Copy</span>
                                </Button>

                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => openUrl(post.customUrl!)}
                                  className="text-gray-500 hover:text-green-500 text-xs h-8 px-2"
                                >
                                  <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                  <span className="hidden sm:inline">{t("pages:posts.openUrl")}</span>
                                  <span className="sm:hidden">Open</span>
                                </Button>
                              </>
                            )}
                            
                            <QrCodeGenerator 
                              post={post}
                              trigger={
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-gray-500 hover:text-blue-500 text-xs h-8 px-2"
                                >
                                  <QrCode className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                  <span className="hidden sm:inline">QR Code</span>
                                  <span className="sm:hidden">QR</span>
                                </Button>
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )})}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6 flex-wrap">
              <Button
                variant="outline"
                disabled={currentPage === 1 || isLoading}
                onClick={() => fetchPosts(currentPage - 1)}
                className="text-xs sm:text-sm h-8 sm:h-9 px-3"
              >
                {t("pages:posts.previous")}
              </Button>
              <span className="flex items-center px-2 sm:px-4 text-xs sm:text-sm">
                {t("pages:posts.pageInfo", { current: currentPage, total: totalPages })}
              </span>
              <Button
                variant="outline"
                disabled={currentPage === totalPages || isLoading}
                onClick={() => fetchPosts(currentPage + 1)}
                className="text-xs sm:text-sm h-8 sm:h-9 px-3"
              >
                {t("pages:posts.next")}
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Create Post */}
        <TabsContent value="create">
          <PostCreator onPostCreated={handlePostCreated} />
        </TabsContent>
      </Tabs>
    </div>
  );
}