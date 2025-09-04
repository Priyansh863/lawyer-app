"use client";

import DashboardLayout from "@/components/layouts/dashboard-layout"
import DashboardHeader from "@/components/dashboard/dashboard-header"
import StatsCards from "@/components/dashboard/stats-cards"
import RecentActivity from "@/components/dashboard/recent-activity"
import QuickActions from "@/components/dashboard/quick-actions"
import ClientAnalytics from "@/components/dashboard/client-analytics"
import { useSelector } from "react-redux"
import { RootState } from "@/lib/store"
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { 
  getPosts, 
  type Post 
} from "@/lib/api/posts-api";
import { User } from "lucide-react";

export default function DashboardPage() {
  const profile = useSelector((state: RootState) => state.auth.user);
  const { toast } = useToast();
  const { t } = useTranslation();
  
  // Posts state
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch posts
  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      const response = await getPosts(1, 8, "published");
      
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

  // Skeleton components
  const PostImageSkeleton = () => (
    <div className="aspect-square rounded-xl overflow-hidden">
      <Skeleton height="100%" className="rounded-xl" />
    </div>
  );

  // Get the most recent post
  const recentPost = posts.length > 0 ? posts[0] : null;

  // Helper function to check if post has an image
  const hasImage = (post: Post) => {
    return post.image && post.image.trim() !== "";
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        <DashboardHeader />
        <StatsCards />
        
        {/* Conditional rendering for client analytics */}
        {profile?.account_type === 'client' && (
          <ClientAnalytics />
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <RecentActivity />
          <QuickActions />
        </div>

        {/* Magazine Style Posts Grid - Korean Style Design */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Recent Posts</h2>
          </div>
          
          {/* Recent Post Feature */}
          {isLoading ? (
            <div className="grid grid-cols-1 gap-6">
              <div className="aspect-[21/9] rounded-xl overflow-hidden">
                <Skeleton height="100%" className="rounded-xl" />
              </div>
            </div>
          ) : recentPost ? (
            <Card className="border-0 shadow-none overflow-hidden group cursor-pointer p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {recentPost.author ? `${recentPost.author.first_name} ${recentPost.author.last_name}` : "Unknown Author"}
                  </p>
                  <p className="text-gray-500 text-sm">
                    {new Date(recentPost.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {recentPost.title}
              </h3>
              
              <p className="text-gray-800">
                {recentPost.excerpt || recentPost.content?.substring(0, 200) + (recentPost.content && recentPost.content.length > 200 ? '...' : '')}
              </p>
              
              {hasImage(recentPost) && (
                <div className="rounded-xl overflow-hidden mt-4">
                  <img
                    src={recentPost.image}
                    alt={recentPost.title}
                    className="w-full h-auto max-h-96 object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
              )}
            </Card>
          ) : null}

          {/* Posts Grid */}
          <div className="flex items-center justify-between mt-12">
            <h2 className="text-2xl font-bold text-gray-900">All Posts</h2>
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <Card key={index} className="p-6 border-0 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <Skeleton circle width={40} height={40} />
                    <div>
                      <Skeleton width={120} height={16} />
                      <Skeleton width={80} height={12} className="mt-1" />
                    </div>
                  </div>
                  <Skeleton count={3} />
                </Card>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <Card className="border-0 shadow-none bg-gray-50/50">
              <CardContent className="text-center py-16">
                <div className="text-gray-300 text-6xl mb-4">📷</div>
                <h3 className="text-lg font-normal text-gray-600 mb-2">No posts yet</h3>
                <p className="text-gray-400 text-sm">
                  You haven't created any posts yet
                </p>
                <button className="mt-4 px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-600 hover:border-gray-300 transition-colors">
                  Create your first post
                </button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {posts.map((post, index) => (
                // Skip the first post as it's already featured
                index > 0 && (
                  <Card key={post._id} className="p-6 border-0 shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {post.author ? `${post.author.first_name} ${post.author.last_name}` : "Unknown Author"}
                        </p>
                        <p className="text-gray-500 text-sm">
                          {new Date(post.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {post.title}
                    </h3>
                    
                    <p className="text-gray-800">
                      {post.excerpt || post.content?.substring(0, 150) + (post.content && post.content.length > 150 ? '...' : '')}
                    </p>
                    
                    {hasImage(post) && (
                      <div className="rounded-xl overflow-hidden mt-4">
                        <img
                          src={post.image}
                          alt={post.title}
                          className="w-full h-auto max-h-80 object-cover"
                        />
                      </div>
                    )}
                  </Card>
                )
              ))}
            </div> 
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}