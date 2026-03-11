"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import PostCreator from "@/components/posts/post-creator";
import {
  getPosts,
  type Post
} from "@/lib/api/posts-api";
import {
  Search,
  MoreHorizontal,
  MessageSquare,
  Link2,
  QrCode,
  EyeOff,
  Slash,
  AlertTriangle,
  User
} from "lucide-react";

export default function PostsPage() {
  const { toast } = useToast();
  const { t } = useTranslation();

  // State
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch posts
  const fetchPosts = async (page = 1) => {
    try {
      setIsLoading(true);
      const response = await getPosts(page, 10, "published");

      const postsData = response.data.posts || [];
      setPosts(postsData);
      setFilteredPosts(postsData);
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

  // Filter posts based on search
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredPosts(posts);
    } else {
      const lowerSearch = searchTerm.toLowerCase();
      setFilteredPosts(posts.filter(post =>
        post.title.toLowerCase().includes(lowerSearch) ||
        post.content.toLowerCase().includes(lowerSearch) ||
        (post.hashtag && post.hashtag.toLowerCase().includes(lowerSearch))
      ));
    }
  }, [searchTerm, posts]);

  // Handle post creation
  const handlePostCreated = (post: Post) => {
    setPosts(prev => [post, ...prev]);
    setIsDialogOpen(false);
    toast({
      title: t("pages:posts.postCreated"),
      description: t("pages:posts.postAddedToList"),
      variant: "default",
    });
  };

  // Mask user name like fag2***
  const maskName = (firstName: string) => {
    if (firstName.length <= 4) return firstName + "***";
    return firstName.substring(0, 4) + "***";
  };

  // Toggle post expansion
  const toggleExpand = (id: string) => {
    setExpandedPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  return (
    <div className="flex flex-col space-y-4">
      {/* Header - Aligned title and search same row */}
      <div className="max-w-7xl mx-auto w-full mb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <h1 className="text-2xl font-bold text-[#0F172A]">Post Creation & Management</h1>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search"
                className="pl-10 bg-white border-slate-200 w-full md:w-[320px] h-10 rounded-lg focus-visible:ring-1 focus-visible:ring-slate-900 focus-visible:ring-offset-0 text-[#0F172A] font-medium placeholder:text-slate-400 shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="bg-[#0F172A] hover:bg-[#1E293B] text-white font-bold h-10 px-8 rounded-lg shadow-lg active:scale-95 transition-all"
            >
              Create Content
            </Button>
          </div>
        </div>
      </div>

      {/* Grid - Masonry Layout */}
      <div className="max-w-7xl mx-auto w-full">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[1, 2, 3, 4].map(i => (
              <Card key={i} className="border-none shadow-sm rounded-2xl overflow-hidden bg-white">
                <CardContent className="p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <Skeleton circle width={48} height={48} />
                    <Skeleton width={100} height={20} />
                  </div>
                  <Skeleton count={4} className="mb-6" />
                  <div className="flex gap-3">
                    <Skeleton width={80} height={80} className="rounded-xl" />
                    <Skeleton width={80} height={80} className="rounded-xl" />
                    <Skeleton width={80} height={80} className="rounded-xl" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-3xl border border-dashed border-slate-200 shadow-sm max-w-2xl mx-auto">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="h-10 w-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-[#0F172A] mb-2">No results found</h3>
            <p className="text-slate-500 font-medium px-6">We couldn't find any posts matching your search. Try broadening your criteria or create a new post.</p>
          </div>
        ) : (
          <div className="columns-1 md:columns-2 gap-8 space-y-8">
            {filteredPosts.map((post) => {
              const isExpanded = expandedPosts.has(post._id);
              const isLong = post.content.length > 220;

              return (
                <Card key={post._id} className="break-inside-avoid border border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white hover:shadow-xl transition-all duration-300 group">
                  <CardContent className="p-8">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                          {post.author.avatar ? (
                            <img src={post.author.avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <User className="h-6 w-6 text-slate-400" />
                          )}
                        </div>
                        <span className="text-base font-bold text-[#0F172A] tracking-tight">{maskName(post.author.first_name)}</span>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-400 hover:text-[#0F172A] hover:bg-slate-50 transition-all rounded-full">
                            <MoreHorizontal className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl border-slate-200 shadow-2xl animate-in fade-in zoom-in duration-200">
                          <DropdownMenuItem className="text-sm font-bold text-slate-700 py-3 px-4 cursor-pointer focus:bg-slate-50 focus:text-[#0F172A] rounded-xl transition-colors">
                            <Link2 className="mr-3 h-4 w-4" /> Copy Link
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-sm font-bold text-slate-700 py-3 px-4 cursor-pointer focus:bg-slate-50 focus:text-[#0F172A] rounded-xl transition-colors">
                            <QrCode className="mr-3 h-4 w-4" /> QR Code
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-sm font-bold text-slate-700 py-3 px-4 cursor-pointer focus:bg-slate-50 focus:text-[#0F172A] rounded-xl transition-colors">
                            <EyeOff className="mr-3 h-4 w-4" /> Not Interested
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-sm font-bold text-slate-700 py-3 px-4 cursor-pointer focus:bg-slate-50 focus:text-[#0F172A] rounded-xl transition-colors">
                            <Slash className="mr-3 h-4 w-4" /> Block
                          </DropdownMenuItem>
                          <div className="h-px bg-slate-100 my-1 mx-2"></div>
                          <DropdownMenuItem className="text-sm font-bold text-red-500 py-3 px-4 cursor-pointer focus:bg-red-50 focus:text-red-600 rounded-xl transition-colors">
                            <AlertTriangle className="mr-3 h-4 w-4" /> Report
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <p className="text-[15px] font-medium text-slate-700 leading-relaxed break-words whitespace-pre-wrap">
                          {isExpanded ? post.content : (isLong ? post.content.substring(0, 220) + "..." : post.content)}
                        </p>
                        {isLong && (
                          <button
                            onClick={() => toggleExpand(post._id)}
                            className="mt-2 text-sm font-bold text-slate-400 hover:text-[#0F172A] transition-colors"
                          >
                            {isExpanded ? "Show Less" : "View More"}
                          </button>
                        )}
                      </div>

                      {post.hashtag && (
                        <p className="text-sm font-bold text-[#0F172A] bg-slate-50 inline-block px-3 py-1 rounded-full border border-slate-100 italic">
                          # {post.hashtag.replace("#", "").trim()}
                        </p>
                      )}

                      {post.image && (
                        <div className="grid grid-cols-3 gap-3">
                          <div className="aspect-square rounded-xl bg-slate-50 overflow-hidden border border-slate-100 group-hover:border-slate-200 transition-colors">
                            <img src={post.image} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div className="aspect-square rounded-xl bg-slate-50 border border-slate-100"></div>
                          <div className="aspect-square rounded-xl bg-slate-50 border border-slate-100"></div>
                        </div>
                      )}


                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-3 mt-16 pb-12 flex-wrap">
            <Button
              variant="outline"
              disabled={currentPage === 1 || isLoading}
              onClick={() => fetchPosts(currentPage - 1)}
              className="border-slate-200 text-slate-600 font-bold h-11 px-8 rounded-xl hover:bg-white hover:border-[#0F172A] shadow-sm transition-all"
            >
              Previous
            </Button>
            <div className="flex items-center px-6 text-sm font-bold text-[#0F172A] bg-white border border-slate-200 rounded-xl shadow-sm">
              Page {currentPage} of {totalPages}
            </div>
            <Button
              variant="outline"
              disabled={currentPage === totalPages || isLoading}
              onClick={() => fetchPosts(currentPage + 1)}
              className="border-slate-200 text-slate-600 font-bold h-11 px-8 rounded-xl hover:bg-white hover:border-[#0F172A] shadow-sm transition-all"
            >
              Next
            </Button>
          </div>
        )}
      </div>

      {/* Create Post Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[700px] p-6 overflow-hidden rounded-md border border-slate-200 shadow-lg bg-white">
          <div className="max-h-[85vh] overflow-y-auto scrollbar-hide">
            <PostCreator onPostCreated={handlePostCreated} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
