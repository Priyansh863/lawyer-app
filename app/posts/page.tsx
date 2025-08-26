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
  QrCode
} from "lucide-react";

export default function PostsPage() {
  const { toast } = useToast();
  const { t } = useTranslation();
  
  // State
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
  const PostCardSkeleton = () => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <Skeleton width={200} height={24} className="mb-2" />
            <div className="flex items-center gap-2 mt-2">
              <Skeleton width={80} height={20} />
              <Skeleton width={60} height={20} />
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Skeleton height={192} className="rounded-lg" />
        
        <div className="space-y-2">
          <Skeleton count={3} height={16} />
        </div>

        <div className="flex items-center gap-1">
          <Skeleton width={100} height={16} />
        </div>

        <div className="flex items-center gap-2">
          <Skeleton width={120} height={16} />
          <Skeleton width={100} height={16} />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Skeleton width={80} height={16} />
            <Skeleton width={24} height={24} circle />
          </div>
          <Skeleton width={200} height={16} />
        </div>

        <div className="flex justify-end pt-2">
          <Skeleton width={100} height={32} />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 mt-7">
      <div className="px-6 py-4 border-b">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          {t("pages:posts.postsContentTitle")}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {t("pages:posts.postsContentDescription")}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {t("pages:posts.myPosts")}
          </TabsTrigger>
          <TabsTrigger value="create" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            {t("pages:posts.createNew")}
          </TabsTrigger>
        </TabsList>

        {/* Posts List */}
        <TabsContent value="list" className="space-y-6">
          {/* Posts Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PostCardSkeleton />
              <PostCardSkeleton />
            </div>
          ) : posts.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{t("pages:posts:noPostsFound")}</h3>
                <p className="text-gray-600 mb-4">
                  {t("pages:posts.noPostsCreatedYet")}
                </p>
                <Button onClick={() => setActiveTab('create')}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t("pages:posts.createFirstPost")}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {posts.map((post) => (
                <Card key={post._id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-2">{post.title}</CardTitle>
                        <div className="flex items-center gap-2 mt-2">
                          {post.isAiGenerated && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Wand2 className="h-3 w-3" />
                              {t("pages:posts.aiGenerated")}
                            </Badge>
                          )}
                          {post.spatialInfo?.latitude && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {t("pages:posts.location")}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Post Image */}
                    {post.image && (
                      <div className="relative w-full h-48 rounded-lg overflow-hidden">
                        <img
                          src={post.image}
                          alt={post.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="text-sm text-gray-600">
                      <div 
                        dangerouslySetInnerHTML={{
                          __html: post.content
                            .replace(/\n/g, '<br>')
                            .replace(/### (.*?)\n/g, '<h3 class="text-base font-bold mt-3 mb-2">$1</h3>')
                            .replace(/#### (.*?)\n/g, '<h4 class="text-sm font-semibold mt-2 mb-1">$1</h4>')
                            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                            .replace(/- (.*?)\n/g, '<li class="ml-4 mb-1">$1</li>')
                        }}
                      />
                    </div>

                    {/* Display hashtags */}
                    {(post.hashtags && post.hashtags.length > 0) ? (
                      <div className="flex items-center gap-1 flex-wrap">
                        <Hash className="h-3 w-3 text-blue-500" />
                        {post.hashtags.map((tag, index) => (
                          <span key={index} className="text-sm text-blue-500">
                            {tag}{index < post.hashtags!.length - 1 ? ', ' : ''}
                          </span>
                        ))}
                      </div>
                    ) : post.hashtag && (
                      <div className="flex items-center gap-1">
                        <Hash className="h-3 w-3 text-blue-500" />
                        <span className="text-sm text-blue-500">{post.hashtag}</span>
                      </div>
                    )}

                    {post.citations && post.citations.length > 0 && (
                      <div className="text-xs text-gray-500">
                        {post.citations.length} {t("pages:posts.citation", { count: post.citations.length })}
                      </div>
                    )}

                    {/* Display useful links */}
                    {post.usefulLinks && post.usefulLinks.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-gray-700">{t("pages:posts.usefulResources")}:</div>
                        {post.usefulLinks.slice(0, 2).map((link, index) => (
                          <div key={index} className="text-xs">
                            <a 
                              href={link.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline"
                            >
                              {link.title}
                            </a>
                            {link.description && (
                              <span className="text-gray-500 ml-1">- {link.description}</span>
                            )}
                          </div>
                        ))}
                        {post.usefulLinks.length > 2 && (
                          <div className="text-xs text-gray-500">+{post.usefulLinks.length - 2} {t("pages:posts.moreResources")}</div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="h-3 w-3" />
                      {formatDate(post.createdAt)}
                      <User className="h-3 w-3 ml-2" />
                      {post.author.first_name} {post.author.last_name}
                    </div>

                    {/* URLs */}
                    {post.customUrl && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium">{t("pages:posts.customUrl")}:</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyUrl(post.customUrl!, t("pages:posts.custom"))}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="text-xs bg-gray-50 p-2 rounded break-all">
                          <a 
                            href={post.customUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline"
                          >
                            {post.customUrl}
                          </a>
                        </div>
                      </div>
                    )}

                    {/* QR Code Generator */}
                    <div className="flex justify-end pt-2">
                      <QrCodeGenerator 
                        post={post}
                        trigger={
                          <Button variant="outline" size="sm">
                            <QrCode className="h-3 w-3 mr-1" />
                            {t('pages:posts.buttonLabel')}
                          </Button>
                        }
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                disabled={currentPage === 1 || isLoading}
                onClick={() => fetchPosts(currentPage - 1)}
              >
                {t("pages:posts.previous")}
              </Button>
              <span className="flex items-center px-4">
                {t("pages:posts.pageInfo", { current: currentPage, total: totalPages })}
              </span>
              <Button
                variant="outline"
                disabled={currentPage === totalPages || isLoading}
                onClick={() => fetchPosts(currentPage + 1)}
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