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
  Globe,
  MoreVertical,
  Bookmark,
  BookmarkCheck,
  Copy,
  Flag
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { toggleBookmark, checkBookmark, reportPost } from "@/lib/api/bookmark-api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { formatDate } from "@/lib/utils/date-formatter";

const getToken = () => {
  if (typeof window !== "undefined") {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user).token : null;
  }
  return null;
};

export default function ProfessionalDashboardPage() {
  const profile = useSelector((state: RootState) => state.auth.user);
  const { toast } = useToast();
  const { t } = useTranslation();
  
  // Posts state
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Set<string>>(new Set());
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportingPostId, setReportingPostId] = useState<string>("");
  const [reportReason, setReportReason] = useState("");
  const [isReporting, setIsReporting] = useState(false);

  // Fetch posts
  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      const response = await getPosts(1, 8, "published","dashboard");
      
      setPosts(response.data.posts || []);
      
      // Check bookmark status for each post (only if user is logged in)
      const token = getToken();
      if (response.data.posts?.length > 0 && token) {
        try {
          const bookmarkChecks = await Promise.allSettled(
            response.data.posts.map((post: Post) => checkBookmark(post._id))
          );

          
          
          const bookmarked = new Set<string>();
          bookmarkChecks.forEach((result, index) => {
            if (result.status === 'fulfilled' && result.value.isBookmarked) {
              bookmarked.add(response.data.posts[index]._id);
            }
          });
          setBookmarkedPosts(bookmarked);
        } catch (error) {
          // Silently fail bookmark checks if authentication fails
          console.log('Bookmark check failed, user may not be logged in');
        }
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
      toast({
        title: t('pages:dashboard.error'),
        description: t('pages:dashboard.failedToLoadPosts'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const togglePostExpansion = (postId: string) => {
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

  const formatContent = (content: string, isExpanded: boolean) => {
    if (!content) return "";
    if (content.length <= 400 || isExpanded) return content;
    return content.substring(0, 400) + "...";
  };

  const hasImage = (post: Post) => {
    return post.image && post.image.trim() !== "";
  };

  const getAuthorAvatar = (author: any) => {
    return author?.profile_image || author?.avatar || null;
  };

  // Handle bookmark toggle
  const handleBookmarkToggle = async (postId: string) => {
    try {
      const result = await toggleBookmark(postId);
      
      setBookmarkedPosts(prev => {
        const newSet = new Set(prev);
        if (result.data.isBookmarked) {
          newSet.add(postId);
        } else {
          newSet.delete(postId);
        }
        return newSet;
      });
      
      toast({
        title: result.data.isBookmarked ? t('pages:dashboard.bookmarked') : t('pages:dashboard.bookmarkRemoved'),
        description: result.message,
      });
    } catch (error: any) {
      toast({
        title: t('pages:dashboard.error'),
        description: error.message || t('pages:dashboard.failedToUpdateBookmark'),
        variant: "destructive",
      });
    }
  };

  // Handle copy URL
  const handleCopyUrl = async (postSlug: string) => {
    try {
      const url = `${window.location.origin}/${postSlug}`;
      await navigator.clipboard.writeText(url);
      toast({
        title: t('pages:dashboard.linkCopied'),
        description: t('pages:dashboard.postUrlCopied'),
      });
    } catch (error) {
      toast({
        title: t('pages:dashboard.error'),
        description: t('pages:dashboard.failedToCopyLink'),
        variant: "destructive",
      });
    }
  };

  // Handle report
  const handleReportClick = (postId: string) => {
    setReportingPostId(postId);
    setShowReportDialog(true);
  };

  const handleReportSubmit = async () => {
    if (!reportReason.trim()) {
      toast({
        title: t('pages:dashboard.error'),
        description: t('pages:dashboard.pleaseEnterReason'),
        variant: "destructive",
      });
      return;
    }

    try {
      setIsReporting(true);
      await reportPost(reportingPostId, reportReason);
      
      toast({
        title: t('pages:dashboard.success'),
        description: t('pages:dashboard.reportSubmitted'),
      });
      
      setShowReportDialog(false);
      setReportReason("");
    } catch (error: any) {
      console.error('Error reporting post:', error);
      toast({
        title: t('pages:dashboard.error'),
        description: error.message || t('pages:dashboard.reportFailed'),
        variant: "destructive",
      });
    } finally {
      setIsReporting(false);
    }
  };

  // Professional post card component
  const PostCard = ({ post }: { post: Post }) => {
    const isExpanded = expandedPosts.has(post._id);
    const hasLongContent = post.content && post.content.length > 400;
    const isBookmarked = bookmarkedPosts.has(post._id);

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
                    {post.author ? `${post.author.first_name} ${post.author.last_name}` : t('pages:dashboard.unknownAuthor')}
                  </h3>
                  <Badge variant="secondary" className="text-xs px-2 py-0.5">
                    {post.author?.account_type || t('pages:dashboard.user')}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {formatDate(post.createdAt)}
                  </span>
                  <span>•</span>
                  <Badge variant={post.status === 'published' ? 'default' : 'secondary'} className="text-xs">
                    {post.status}
                  </Badge>
                </div>
              </div>
            </div>
            
            {/* Post Actions Dropdown */}
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                <FileText className="h-3 w-3 mr-1" />
                {t('pages:dashboard.legalPost')}
              </Badge>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => handleBookmarkToggle(post._id)}>
                    {isBookmarked ? (
                      <BookmarkCheck className="mr-2 h-4 w-4" />
                    ) : (
                      <Bookmark className="mr-2 h-4 w-4" />
                    )}
                    {isBookmarked ? t('pages:dashboard.bookmarked') : t('pages:dashboard.bookmark')}
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={() => handleCopyUrl(post.slug)}>
                    <Copy className="mr-2 h-4 w-4" />
                    {t('pages:dashboard.copyLink')}
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={() => handleReportClick(post._id)}>
                    <Flag className="mr-2 h-4 w-4" />
                    {t('pages:dashboard.report')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
                  {t('pages:dashboard.showLess')}
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  {t('pages:dashboard.readMore')}
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
              {t('pages:dashboard.tags')}
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
              {t('pages:dashboard.legalResources')}
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
                        {t('pages:dashboard.visitResource')}
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
              {t('pages:dashboard.shareLinks')}
            </h4>
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="space-y-3">
                {post.customUrl && (
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">{t('pages:dashboard.customUrl')}</label>
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
                        {t('pages:dashboard.copy')}
                      </Button>
                    </div>
                  </div>
                )}
                {post.shortUrl && (
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">{t('pages:dashboard.shortUrl')}</label>
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
                        {t('pages:dashboard.copy')}
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
                {t('pages:dashboard.created')}: {formatDate(post.createdAt)}
              </span>
              {post.updatedAt && post.updatedAt !== post.createdAt && (
                <span className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {t('pages:dashboard.updated')}: {formatDate(post.updatedAt)}
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  };

  // Render loading state
  if (isLoading) {
    return (
      <DashboardLayout>
        <DashboardHeader 
          title={t('pages:dashboard.dashboard')} 
          subtitle={t('pages:dashboard.welcomeBack', { name: profile?.first_name || '' })}
        />
        <div className="space-y-6">
          <StatsCards />
          <QuickActions />
          <Card>
            <CardContent className="p-6">
              <Skeleton height={200} />
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // Render empty state if no posts
  if (posts.length === 0) {
    return (
      <DashboardLayout>
        <DashboardHeader 
          title={t('pages:dashboard.dashboard')} 
          subtitle={t('pages:dashboard.welcomeBack', { name: profile?.first_name || '' })}
        />
        <div className="space-y-6">
          <StatsCards />
          <QuickActions />
          <Card>
            <CardContent className="p-6 text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-lg font-medium">
                {t('pages:dashboard.noPostsTitle')}
              </h3>
              <p className="text-muted-foreground mt-1">
                {t('pages:dashboard.noPostsDescription')}
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // Report Dialog
  const renderReportDialog = () => (
    <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('pages:dashboard.reportPost')}</DialogTitle>
          <DialogDescription>
            {t('pages:dashboard.reportDescription')}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">{t('pages:dashboard.reason')}</Label>
            <Textarea
              id="reason"
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder={t('pages:dashboard.reasonPlaceholder')}
              className="min-h-[100px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => setShowReportDialog(false)}
            disabled={isReporting}
          >
            {t('pages:dashboard.cancel')}
          </Button>
          <Button 
            onClick={handleReportSubmit}
            disabled={!reportReason.trim() || isReporting}
          >
            {isReporting ? t('pages:dashboard.submitting') : t('pages:dashboard.submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        <DashboardHeader 
          title={t('pages:dashboard.dashboard')} 
          subtitle={t('pages:dashboard.welcomeBack', { name: profile?.first_name || '' })}
        />
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
              <h2 className="text-2xl font-bold text-gray-900">{t('pages:dashboard.legalPosts')}</h2>
              <p className="text-gray-600 text-sm mt-1">{t('pages:dashboard.professionalContent')}</p>
            </div>
            <Badge variant="secondary" className="px-3 py-1">
              {posts.length} {t('pages:dashboard.posts')}
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
                <h3 className="text-lg font-normal text-gray-600 mb-2">{t('pages:dashboard.noPostsTitle')}</h3>
                <p className="text-gray-400 text-sm">
                  {t('pages:dashboard.noPostsDescription')}
                </p>
                <Button className="mt-4" variant="outline">
                  {t('pages:dashboard.createPost')}
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

        {renderReportDialog()}
      </div>
    </DashboardLayout>
  );
}