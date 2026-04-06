"use client";

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { cn } from "@/lib/utils";
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
  reportPost,
  generateQrCode,
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
import type { RootState } from "@/lib/store";

export default function PostsPage() {
  const { toast } = useToast();
  const { t } = useTranslation();

  const user = useSelector((state: RootState) => state.auth.user);
  const canCreateContent = user?.account_type === "lawyer";

  // State
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Content preferences (persisted)
  const [hiddenPostIds, setHiddenPostIds] = useState<Set<string>>(new Set());
  const [blockedAuthorIds, setBlockedAuthorIds] = useState<Set<string>>(new Set());

  const PREF_HIDDEN_POSTS_KEY = "posts_hidden_posts_v1";
  const PREF_BLOCKED_AUTHORS_KEY = "posts_blocked_authors_v1";

  const loadPrefs = () => {
    try {
      const hiddenRaw = localStorage.getItem(PREF_HIDDEN_POSTS_KEY);
      const blockedRaw = localStorage.getItem(PREF_BLOCKED_AUTHORS_KEY);
      const hiddenArr: any[] = hiddenRaw ? JSON.parse(hiddenRaw) : [];
      const blockedArr: any[] = blockedRaw ? JSON.parse(blockedRaw) : [];

      setHiddenPostIds(new Set(hiddenArr.map((x) => (typeof x === "string" ? x : x?.id)).filter(Boolean)));
      setBlockedAuthorIds(new Set(blockedArr.map((x) => (typeof x === "string" ? x : x?.id)).filter(Boolean)));
    } catch {
      setHiddenPostIds(new Set());
      setBlockedAuthorIds(new Set());
    }
  };

  const persistPrefs = (opts: {
    hiddenPosts?: Array<{ id: string; title?: string }>;
    blockedAuthors?: Array<{ id: string; name?: string }>;
  }) => {
    try {
      if (opts.hiddenPosts) localStorage.setItem(PREF_HIDDEN_POSTS_KEY, JSON.stringify(opts.hiddenPosts));
      if (opts.blockedAuthors) localStorage.setItem(PREF_BLOCKED_AUTHORS_KEY, JSON.stringify(opts.blockedAuthors));
      window.dispatchEvent(new Event("contentPreferencesUpdated"));
    } catch {
      // ignore
    }
  };

  // QR and Report dialog states
  const [selectedPostForQr, setSelectedPostForQr] = useState<Post | null>(null);
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);

  const [selectedPostForReport, setSelectedPostForReport] = useState<Post | null>(null);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [isReporting, setIsReporting] = useState(false);

  // Fetch posts
  const fetchPosts = async (page = 1) => {
    try {
      setIsLoading(true);
      const response = await getPosts(page, 10, "published");

      const postsData = response.data.posts || [];
      // Apply persisted preferences
      const visible = postsData.filter((p: any) => {
        const postId = p?._id;
        const authorId = p?.author?._id;
        if (postId && hiddenPostIds.has(postId)) return false;
        if (authorId && blockedAuthorIds.has(authorId)) return false;
        return true;
      });
      setPosts(visible);
      setFilteredPosts(visible);
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
    loadPrefs();
    fetchPosts(1);
  }, []);

  // Re-apply preferences after prefs change (or when Settings undoes them)
  useEffect(() => {
    const handler = () => loadPrefs();
    window.addEventListener("contentPreferencesUpdated", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("contentPreferencesUpdated", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  useEffect(() => {
    // When prefs change, refetch current page (keeps pagination consistent)
    fetchPosts(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hiddenPostIds.size, blockedAuthorIds.size]);

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
    const normalizedPost: Post = {
      ...post,
      author: post.author?._id
        ? post.author
        : {
          _id: (user as any)?._id || "",
          first_name: (user as any)?.first_name || "User",
          last_name: (user as any)?.last_name || "",
          email: (user as any)?.email || "",
          avatar: (user as any)?.avatar,
        },
    };

    setPosts(prev => [normalizedPost, ...prev]);
    // We don't close the dialog immediately anymore so the user can see the success card
    // setIsDialogOpen(false); 
    toast({
      title: t("pages:posts.postCreated"),
      description: t("pages:posts.postAddedToList"),
      variant: "default",
    });
  };

  // Mask user name like fag2***
  const maskName = (firstName: string) => {
    if (!firstName) return "User***";
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

  // Action Handlers
  const handleCopyLink = (post: Post) => {
    const url = post.customUrl || post.shortUrl || `${window.location.origin}/posts#${post.slug}`;
    navigator.clipboard.writeText(url);
    toast({
      title: t("pages:posts.actions.linkCopied"),
      description: t("pages:posts.actions.linkCopiedDesc"),
    });
  };

  const handleShowQrCode = async (post: Post) => {
    if (post.qrCodeUrl) {
      setSelectedPostForQr(post);
      setIsQrDialogOpen(true);
      return;
    }

    try {
      setIsGeneratingQr(true);
      const response = await generateQrCode(post.slug);
      const updatedPost = { ...post, qrCodeUrl: response.data.qrCodeDataUrl };
      setPosts(prev => prev.map(p => p._id === post._id ? updatedPost : p));
      setFilteredPosts(prev => prev.map(p => p._id === post._id ? updatedPost : p));
      setSelectedPostForQr(updatedPost);
      setIsQrDialogOpen(true);
    } catch (error: any) {
      toast({
        title: t("pages:posts.actions.qrError"),
        description: error.message || t("pages:posts.somethingWentWrong"),
        variant: "destructive",
      });
    } finally {
      setIsGeneratingQr(false);
    }
  };

  const handleNotInterested = (postId: string) => {
    const post = posts.find((p) => p._id === postId);
    // Persist hide
    try {
      const existingRaw = localStorage.getItem(PREF_HIDDEN_POSTS_KEY);
      const existing: any[] = existingRaw ? JSON.parse(existingRaw) : [];
      const next = [
        ...existing.filter((x) => (typeof x === "string" ? x : x?.id) !== postId),
        { id: postId, title: post?.title },
      ];
      persistPrefs({ hiddenPosts: next });
    } catch {
      // ignore
    }
    setPosts((prev) => prev.filter((p) => p._id !== postId));
    setFilteredPosts((prev) => prev.filter((p) => p._id !== postId));
    toast({
      title: t("pages:posts.actions.notInterestedTitle"),
      description: t("pages:posts.actions.notInterestedDesc"),
    });
  };

  const handleBlockUser = (authorId: string) => {
    const authorPost = posts.find((p: any) => p?.author?._id === authorId);
    const authorName = authorPost?.author?.first_name || (authorPost as any)?.author?.name || undefined;
    // Persist block
    try {
      const existingRaw = localStorage.getItem(PREF_BLOCKED_AUTHORS_KEY);
      const existing: any[] = existingRaw ? JSON.parse(existingRaw) : [];
      const next = [
        ...existing.filter((x) => (typeof x === "string" ? x : x?.id) !== authorId),
        { id: authorId, name: authorName },
      ];
      persistPrefs({ blockedAuthors: next });
    } catch {
      // ignore
    }
    setPosts((prev) => prev.filter((p: any) => p.author._id !== authorId));
    setFilteredPosts((prev) => prev.filter((p: any) => p.author._id !== authorId));
    toast({
      title: t("pages:posts.actions.blockedTitle"),
      description: t("pages:posts.actions.blockedDesc"),
    });
  };

  const handleReportSubmit = async () => {
    if (!selectedPostForReport || reportReason.trim().length < 10) return;

    try {
      setIsReporting(true);
      await reportPost(selectedPostForReport._id, reportReason);
      toast({
        title: t("pages:posts.actions.reportSuccess"),
        description: t("pages:posts.actions.reportSuccessDesc"),
      });
      setIsReportDialogOpen(false);
      setReportReason("");
    } catch (error: any) {
      toast({
        title: t("pages:posts.actions.reportError"),
        description: error.message || t("pages:posts.somethingWentWrong"),
        variant: "destructive",
      });
    } finally {
      setIsReporting(false);
    }
  };

  return (
    <div className="flex flex-col space-y-4">
      {/* Header - Aligned title and search same row */}
      <div className="max-w-7xl mx-auto w-full mb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <h1 className="text-2xl font-bold text-[#0F172A]">{t("pages:posts.title")}</h1>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder={t("pages:posts.searchPlaceholder")}
                className="pl-10 bg-white border-slate-200 w-full md:w-[320px] h-10 rounded-lg focus-visible:ring-1 focus-visible:ring-slate-900 focus-visible:ring-offset-0 text-[#0F172A] font-medium placeholder:text-slate-400 shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {canCreateContent && (
              <Button
                onClick={() => setIsDialogOpen(true)}
                className="bg-[#0F172A] hover:bg-[#1E293B] text-white font-bold h-10 px-8 rounded-lg shadow-lg active:scale-95 transition-all"
              >
                {t("pages:posts.createContent")}
              </Button>
            )}
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
            <h3 className="text-xl font-bold text-[#0F172A] mb-2">{t("pages:posts.noResults.title")}</h3>
            <p className="text-slate-500 font-medium px-6">{t("pages:posts.noResults.description")}</p>
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
                          <DropdownMenuItem
                            onClick={() => handleCopyLink(post)}
                            className="text-sm font-bold text-slate-700 py-3 px-4 cursor-pointer focus:bg-slate-50 focus:text-[#0F172A] rounded-xl transition-colors"
                          >
                            <Link2 className="mr-3 h-4 w-4" /> {t("pages:posts.actions.copyLink")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleShowQrCode(post)}
                            className="text-sm font-bold text-slate-700 py-3 px-4 cursor-pointer focus:bg-slate-50 focus:text-[#0F172A] rounded-xl transition-colors"
                          >
                            <QrCode className="mr-3 h-4 w-4" /> {t("pages:posts.actions.qrCode")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleNotInterested(post._id)}
                            className="text-sm font-bold text-slate-700 py-3 px-4 cursor-pointer focus:bg-slate-50 focus:text-[#0F172A] rounded-xl transition-colors"
                          >
                            <EyeOff className="mr-3 h-4 w-4" /> {t("pages:posts.actions.notInterested")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleBlockUser(post.author._id)}
                            className="text-sm font-bold text-slate-700 py-3 px-4 cursor-pointer focus:bg-slate-50 focus:text-[#0F172A] rounded-xl transition-colors"
                          >
                            <Slash className="mr-3 h-4 w-4" /> {t("pages:posts.actions.block")}
                          </DropdownMenuItem>
                          <div className="h-px bg-slate-100 my-1 mx-2"></div>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedPostForReport(post);
                              setIsReportDialogOpen(true);
                            }}
                            className="text-sm font-bold text-red-500 py-3 px-4 cursor-pointer focus:bg-red-50 focus:text-red-600 rounded-xl transition-colors"
                          >
                            <AlertTriangle className="mr-3 h-4 w-4" /> {t("pages:posts.actions.report")}
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
                            {isExpanded ? t("pages:posts.showLess") : t("pages:posts.viewMore")}
                          </button>
                        )}
                      </div>

                      {post.hashtag && (
                        <p className="text-sm font-bold text-[#0F172A] bg-slate-50 inline-block px-3 py-1 rounded-full border border-slate-100 italic">
                          # {post.hashtag.replace("#", "").trim()}
                        </p>
                      )}

                      {(post.images && post.images.length > 0) || post.image ? (
                        <div className="grid grid-cols-3 gap-3">
                          {post.images && post.images.length > 0 ? (
                            post.images.slice(0, 3).map((img, idx) => (
                              <div key={idx} className="aspect-square rounded-2xl bg-slate-50 overflow-hidden border border-slate-100 group-hover:border-slate-200 transition-all duration-300">
                                <img src={img} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                              </div>
                            ))
                          ) : (
                            post.image && (
                              <div className="aspect-square rounded-2xl bg-slate-50 overflow-hidden border border-slate-100 group-hover:border-slate-200 transition-all duration-300">
                                <img src={post.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                              </div>
                            )
                          )}
                        </div>
                      ) : null}


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
              {t("pages:posts.pagination.previous")}
            </Button>
            <div className="flex items-center px-6 text-sm font-bold text-[#0F172A] bg-white border border-slate-200 rounded-xl shadow-sm">
              {t("pages:posts.pagination.pageOf", { current: currentPage, total: totalPages })}
            </div>
            <Button
              variant="outline"
              disabled={currentPage === totalPages || isLoading}
              onClick={() => fetchPosts(currentPage + 1)}
              className="border-slate-200 text-slate-600 font-bold h-11 px-8 rounded-xl hover:bg-white hover:border-[#0F172A] shadow-sm transition-all"
            >
              {t("pages:posts.pagination.next")}
            </Button>
          </div>
        )}
      </div>

      {/* Create Post Dialog */}
      {canCreateContent && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          {/* Single scroll container to avoid double scrollbars */}
          <DialogContent className="sm:max-w-[700px] p-0 max-h-[90vh] overflow-y-auto rounded-md border border-slate-200 shadow-lg bg-white">
            <PostCreator onPostCreated={handlePostCreated} />
          </DialogContent>
        </Dialog>
      )}
      {/* QR Code Dialog */}
      <Dialog open={isQrDialogOpen} onOpenChange={setIsQrDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#0F172A] text-center mb-6">
              {t("pages:posts.qrCodeTitle")}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            {selectedPostForQr?.qrCodeUrl ? (
              <img
                src={selectedPostForQr.qrCodeUrl}
                alt="QR Code"
                className="w-64 h-64 shadow-2xl rounded-xl border-4 border-white"
              />
            ) : (
              <div className="w-64 h-64 flex items-center justify-center">
                <Skeleton width={200} height={200} />
              </div>
            )}
            <p className="mt-8 text-sm font-bold text-slate-500 text-center leading-relaxed">
              {t("pages:posts.qrCodeInstructions")}
            </p>
          </div>
          <div className="mt-8 flex gap-3">
            <Button
              variant="outline"
              className="flex-1 py-6 rounded-xl font-bold text-slate-600 border-slate-200 hover:bg-slate-50"
              onClick={() => setIsQrDialogOpen(false)}
            >
              {t("common:actions.close")}
            </Button>
            <Button
              className="flex-1 py-6 rounded-xl font-bold bg-[#0F172A] hover:bg-slate-800 transition-all text-white"
              onClick={() => {
                if (selectedPostForQr) handleCopyLink(selectedPostForQr);
              }}
            >
              <Link2 className="mr-2 h-4 w-4" /> {t("pages:posts.actions.copyLink")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Report Dialog */}
      <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#0F172A] mb-2">
              {t("pages:posts.reportTitle")}
            </DialogTitle>
            <p className="text-slate-500 text-sm font-medium">
              {t("pages:posts.reportSubtitle")}
            </p>
          </DialogHeader>
          <div className="space-y-6 mt-6">
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-700 ml-1">
                {t("pages:posts.reportReasonLabel")}
              </label>
              <textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder={t("pages:posts.reportReasonPlaceholder")}
                className="w-full h-40 p-5 rounded-2xl border-slate-200 focus:border-[#0F172A] focus:ring-4 focus:ring-slate-100 transition-all font-medium text-slate-700 resize-none outline-none border"
              />
              <p className="text-[11px] font-bold text-slate-400 ml-1">
                {t("pages:posts.reportReasonHint")}
              </p>
            </div>
          </div>
          <div className="mt-8 flex gap-3">
            <Button
              variant="outline"
              className="flex-1 py-6 rounded-xl font-bold text-slate-600 border-slate-200 hover:bg-slate-50"
              onClick={() => {
                setIsReportDialogOpen(false);
                setReportReason("");
              }}
              disabled={isReporting}
            >
              {t("common:actions.cancel")}
            </Button>
            <Button
              className="flex-1 py-6 rounded-xl font-bold bg-red-500 hover:bg-red-600 transition-all text-white disabled:opacity-50"
              onClick={handleReportSubmit}
              disabled={isReporting || reportReason.trim().length < 10}
            >
              {isReporting ? t("common:actions.submitting") : t("pages:posts.actions.reportPost")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
