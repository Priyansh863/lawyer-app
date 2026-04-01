"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
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
import { useSelector } from "react-redux";
import type { RootState } from "@/lib/store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  createPost,
  updatePost,
  generateAiPost,
  generateQrCode,
  generateAiImage,
  type CreatePostData,
  type GenerateAiPostData,
  type SpatialInfo,
  type Citation,
  type Post
} from "@/lib/api/posts-api";
import { uploadFileOnS3 } from "@/lib/helpers/fileupload";
import LocationUrlGenerator from "./location-url-generator";
import {
  Wand2,
  FileText,
  Send,
  Loader2,
  QrCode as QrCodeIcon,
  Share2,
  Copy,
  Hash,
  MapPin,
  User,
  Link,
  Plus,
  Trash2,
  ExternalLink,
  X,
  Download
} from "lucide-react";

interface PostCreatorProps {
  onPostCreated?: (post: Post) => void;
  initialData?: Partial<CreatePostData>;
}

export default function PostCreator({ onPostCreated, initialData }: PostCreatorProps) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const user = useSelector((state: RootState) => state.auth.user);

  // Form state
  const [activeTab, setActiveTab] = useState<'manual' | 'ai'>('manual');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [createdPost, setCreatedPost] = useState<Post | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);

  // Image upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Manual post data
  const [postData, setPostData] = useState<CreatePostData>({
    title: '',
    content: '',
    spatialInfo: undefined,
    citations: [],
    hashtag: '',
    status: 'published',
    images: [],
    ...initialData
  });

  // AI generation data
  const [aiData, setAiData] = useState<GenerateAiPostData>({
    prompt: '',
    topic: '',
    tone: 'professional',
    length: 'long',
    includeHashtags: true,
    language: 'ko',
    spatialInfo: undefined,
    citations: []
  });

  // Citations management
  const [newCitation, setNewCitation] = useState<Citation>({
    type: 'url',
    content: ''
  });

  // AI image generation state
  const [aiImagePrompt, setAiImagePrompt] = useState('');
  const [aiImageUrl, setAiImageUrl] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const addUniqueImage = (existing: string[] = [], nextImage?: string, max: number = 3) => {
    if (!nextImage) return existing.slice(0, max);
    if (existing.includes(nextImage)) return existing.slice(0, max);
    return [...existing, nextImage].slice(0, max);
  };

  // Download image function
  const downloadImage = async (imageUrl: string, filename: string) => {
    try {
      // Open image in new tab
      const newWindow = window.open(imageUrl, '_blank');

      // Download and save to local storage
      const response = await fetch(imageUrl);
      const blob = await response.blob();

      // Create object URL for download
      const blobUrl = URL.createObjectURL(blob);

      // Create download link
      const downloadLink = document.createElement('a');
      downloadLink.href = blobUrl;
      downloadLink.download = filename;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      // Clean up object URL
      URL.revokeObjectURL(blobUrl);

      // Save to local storage
      const reader = new FileReader();
      reader.onload = function (e) {
        if (e.target?.result) {
          try {
            // Get existing downloads from local storage
            const existingDownloads = JSON.parse(localStorage.getItem('downloadedImages') || '[]');

            // Add new download
            const newDownload = {
              id: Date.now().toString(),
              url: imageUrl,
              filename: filename,
              dataUrl: e.target.result as string,
              downloadedAt: new Date().toISOString(),
              type: blob.type,
              size: blob.size
            };

            // Save back to local storage
            const updatedDownloads = [newDownload, ...existingDownloads.slice(0, 49)]; // Keep last 50 items
            localStorage.setItem('downloadedImages', JSON.stringify(updatedDownloads));

            toast({
              title: t('pages:creator.buttons.success'),
              description: t('pages:creator.buttons.successDesc'),
              variant: "default",
            });

          } catch (storageError) {
            console.error('Error saving to local storage:', storageError);
            toast({
              title: t('creator.post.download.toast.partialSuccess'),
              description: t('creator.post.download.toast.partialSuccessDesc'),
              variant: "default",
            });
          }
        }
      };

      reader.readAsDataURL(blob);

    } catch (error) {
      console.error('Error downloading image:', error);
      toast({
        title: t('pages:creator.post.download.toast.failed', 'Download Failed'),
        description: t('pages:creator.post.download.toast.failedDesc', 'Could not download the image. Please try again.'),
        variant: "destructive",
      });
    }
  };

  // Get downloaded images from local storage
  const getDownloadedImages = () => {
    try {
      return JSON.parse(localStorage.getItem('downloadedImages') || '[]');
    } catch (error) {
      console.error('Error reading downloaded images:', error);
      return [];
    }
  };

  // Clear downloaded images from local storage
  const clearDownloadedImages = () => {
    try {
      localStorage.removeItem('downloadedImages');
      toast({
        title: t('pages:creator.buttons.cleared'),
        description: t('pages:creator.buttons.clearedDesc'),
        variant: "default",
      });
    } catch (error) {
      console.error('Error clearing downloaded images:', error);
      toast({
        title: t('pages:creator.buttons.clearFailed'),
        description: t('pages:creator.buttons.clearFailedDesc'),
        variant: "destructive",
      });
    }
  };


  // Add citation
  const addCitation = () => {
    if (!newCitation.content.trim()) {
      toast({
        title: t('pages:creator.post.citations.toast.required'),
        description: t('pages:creator.post.citations.toast.requiredDesc'),
        variant: "destructive",
      });
      return;
    }

    const citation = {
      type: newCitation.type,
      content: newCitation.content.trim(),
      ...(newCitation.type === 'user' && { userId: newCitation.content.trim() }),
      ...(newCitation.type === 'url' && { url: newCitation.content.trim() })
    };

    if (activeTab === 'manual') {
      setPostData(prev => ({
        ...prev,
        citations: [...(prev.citations || []), citation]
      }));
    } else {
      setAiData(prev => ({
        ...prev,
        citations: [...(prev.citations || []), citation]
      }));
    }

    setNewCitation({ type: 'url', content: '' });
  };

  // Remove citation
  const removeCitation = (index: number) => {
    if (activeTab === 'manual') {
      setPostData(prev => ({
        ...prev,
        citations: prev.citations?.filter((_, i) => i !== index) || []
      }));
    } else {
      setAiData(prev => ({
        ...prev,
        citations: prev.citations?.filter((_, i) => i !== index) || []
      }));
    }
  };

  // Handle location selection
  const handleLocationSelect = (spatialInfo: SpatialInfo) => {
    if (activeTab === 'manual') {
      setPostData(prev => ({ ...prev, spatialInfo }));
    } else {
      setAiData(prev => ({ ...prev, spatialInfo }));
    }
  };

  // Handle image upload
  const handleImageUpload = async (file: File) => {
    try {
      setIsUploadingImage(true);
      setUploadProgress(0);

      const timestamp = new Date().getTime();
      const filePath = `posts/${timestamp}-${file.name}`;

      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 100);

      const imageUrl = await uploadFileOnS3(file, filePath);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (imageUrl) {
        setPostData(prev => ({ 
          ...prev, 
          image: prev.images?.length === 0 ? imageUrl : prev.image, // Fallback for single image
          images: addUniqueImage(prev.images || [], imageUrl, 3)
        }));
        toast({
          title: t('pages:creator.post.image.toast.success'),
          description: t('pages:creator.post.image.toast.successDesc'),
          variant: "default",
        });
      } else {
        throw new Error(t('pages:creator.post.image.toast.failed'));
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: t('pages:creator.post.image.toast.failed'),
        description: t('pages:creator.post.image.toast.failedDesc'),
        variant: "destructive",
      });
    } finally {
      setIsUploadingImage(false);
      setUploadProgress(0);
    }
  };

  // Create manual post
  const handleNext = async () => {
    // Check if content exists (either manual or AI generated)
    if (activeTab === 'manual') {
      if (!postData.title.trim() || !postData.content.trim()) {
        toast({
          title: t('pages:creator.post.toast.requiredFields'),
          description: t('pages:creator.post.toast.requiredFieldsDesc'),
          variant: "destructive",
        });
        return;
      }
      // Open location modal for manual content
      setShowLocationModal(true);
    } else {
      // AI tab
      if (!aiData.prompt?.trim() && !aiData.topic?.trim()) {
        toast({
          title: t('pages:creator.post.ai.toast.missingInput'),
          description: t('pages:creator.post.ai.toast.missingInputDesc'),
          variant: "destructive",
        });
        return;
      }
      
      // If content not generated yet, generate it first
      if (!createdPost) {
        await handleGenerateAiPost();
        // handleGenerateAiPost will open the modal after generation
      } else {
        // Content already generated, just open modal
        setShowLocationModal(true);
      }
    }
  };

  const handleCreatePost = async () => {
    if (isCreating) return;

    if (!postData.title.trim() || !postData.content.trim()) {
      toast({
        title: t('pages:creator.post.toast.requiredFields'),
        description: t('pages:creator.post.toast.requiredFieldsDesc'),
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCreating(true);
      
      // Ensure we send at least the first image to the 'image' field for compatibility
      const finalPostData = {
        ...postData,
        image: postData.images && postData.images.length > 0 ? postData.images[0] : postData.image
      };

      let response;
      // If we already have a post ID (e.g. from AI generation), update it instead of creating new
      if (createdPost && createdPost._id) {
        response = await updatePost(createdPost._id, finalPostData);
      } else {
        response = await createPost(finalPostData);
      }
      
      const post = response.data;

      setCreatedPost(post);
      setIsSuccess(true);
      
      onPostCreated?.(post);

      toast({
        title: t('pages:creator.post.toast.created'),
        description: t('pages:creator.post.toast.createdDesc', { title: post.title }),
        variant: "default",
      });

      // Reset form but keep createdPost for the success view
      setPostData({
        title: '',
        content: '',
        spatialInfo: undefined,
        citations: [],
        hashtag: '',
        status: 'published',
        images: []
      });

      setSelectedFile(null);
      setShowLocationModal(false);

    } catch (error: any) {
      toast({
        title: t('pages:creator.post.toast.failed'),
        description: error.message || t('pages:creator.post.toast.failedDesc'),
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Generate AI post
  const handleGenerateAiPost = async () => {
    if (!aiData.prompt?.trim() && !aiData.topic?.trim()) {
      toast({
        title: t('pages:creator.post.ai.toast.missingInput'),
        description: t('pages:creator.post.ai.toast.missingInputDesc'),
        variant: "destructive",
      });
      return;
    }

    try {
      setIsGeneratingAi(true);

      const aiDataWithImage = {
        ...aiData,
        image: postData.image
      };

      const response = await generateAiPost(aiDataWithImage);
      const generatedPost = response.data;

      // Update postData with AI generated content (preserve images if AI didn't return any)
      setPostData(prev => {
        const hasAiImages = generatedPost.images && generatedPost.images.length > 0;
        const hasAiImage = !!generatedPost.image;
        
        return {
          ...prev,
          title: generatedPost.title || prev.title,
          content: generatedPost.content || prev.content,
          hashtag: generatedPost.hashtag || prev.hashtag,
          spatialInfo: generatedPost.spatialInfo || prev.spatialInfo,
          citations: generatedPost.citations || prev.citations,
          image: hasAiImage ? generatedPost.image : prev.image,
          images: hasAiImages ? generatedPost.images : (hasAiImage ? [generatedPost.image] : prev.images)
        };
      });

      // Store generated post for reference but don't show success screen yet
      setCreatedPost(generatedPost);
      setIsSuccess(false);

      toast({
        title: t('pages:creator.post.ai.toast.generated'),
        description: t('pages:creator.post.ai.toast.generatedDesc', { title: generatedPost.title }),
        variant: "default",
      });

      // Switch to manual tab to allow preview and editing
      setActiveTab('manual');

    } catch (error: any) {
      toast({
        title: t('pages:creator.post.ai.toast.failed'),
        description: error.message || t('pages:creator.post.ai.toast.failedDesc'),
        variant: "destructive",
      });
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Generate QR code for created post
  const handleGenerateQrCode = async () => {
    if (!createdPost) return;

    try {
      const response = await generateQrCode(createdPost.slug);

      toast({
        title: t('pages:creator.post.qr.toast.generated'),
        description: t('pages:creator.post.qr.toast.generatedDesc'),
        variant: "default",
      });

      setCreatedPost(prev => prev ? { ...prev, qrCodeUrl: response.data.qrCodeUrl } : null);

    } catch (error: any) {
      toast({
        title: t('pages:creator.post.qr.toast.failed'),
        description: error.message || t('pages:creator.post.qr.toast.failedDesc'),
        variant: "destructive",
      });
    }
  };

  // Copy URL to clipboard
  const copyUrl = (url: string, type: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: t('pages:creator.post.url.toast.copied'),
      description: t('pages:creator.post.url.toast.copiedDesc', { type }),
      variant: "default",
    });
  };

  // Copy image to clipboard
  const copyImageToClipboard = async (imageUrl: string) => {
    try {
      // Fetch the image
      const response = await fetch(imageUrl);
      const blob = await response.blob();

      // Create a clipboard item with the image
      const clipboardItem = new ClipboardItem({
        [blob.type]: blob
      });

      // Write to clipboard
      await navigator.clipboard.write([clipboardItem]);

      toast({
        title: t('pages:creator.buttons.copied'),
        description: t('pages:creator.buttons.copiedDesc'),
        variant: "default",
      });
    } catch (error) {
      console.error('Error copying image to clipboard:', error);
      toast({
        title: t('pages:creator.buttons.copyFailed'),
        description: t('pages:creator.buttons.copyFailedDesc'),
        variant: "destructive",
      });
    }
  };

  // Handle AI image generation
  const handleGenerateAiImage = async () => {
    if (!aiImagePrompt.trim()) {
      toast({
        title: t('pages:creator.post.ai.image.toast.missingInput'),
        description: t('pages:creator.post.ai.image.toast.missingInputDesc'),
        variant: 'destructive',
      });
      return;
    }
    try {
      setIsGeneratingImage(true);
      const response = await generateAiImage({ prompt: aiImagePrompt });
      setAiImageUrl(response.data.imageUrl);
      toast({
        title: t('pages:creator.post.ai.image.toast.generated'),
        description: t('pages:creator.post.ai.image.toast.generatedDesc'),
        variant: 'default',
      });
      // Optionally add image to postData or aiData
      setPostData(prev => ({ 
        ...prev, 
        image: prev.images?.length === 0 ? response.data.imageUrl : prev.image,
        images: addUniqueImage(prev.images || [], response.data.imageUrl, 3)
      }));
    } catch (error: any) {
      toast({
        title: t('pages:creator.post.ai.image.toast.failed'),
        description: error.message || t('pages:creator.post.ai.image.toast.failedDesc'),
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const currentCitations = activeTab === 'manual' ? postData.citations : aiData.citations;
  const downloadedImages = getDownloadedImages();

  return (
    <div className="space-y-6 p-6">
      {/* Created Post Display - Only show after FINAL success */}
      {isSuccess && createdPost && (
        <Card className="border-green-200 bg-green-50 rounded-md shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <FileText className="h-5 w-5" />
              {t('pages:creator.post.created.title')}
              <Button
                size="sm"
                variant="ghost"
                className="ml-auto"
                onClick={() => setCreatedPost(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold">{createdPost.title}</h3>
              <p className="text-sm text-gray-600 mt-1">
                {createdPost.content.substring(0, 200)}...
              </p>
            </div>

            {createdPost.hashtag && (
              <Badge variant="secondary">{createdPost.hashtag}</Badge>
            )}

            {createdPost.slug && (
              <div className="space-y-2">
                <Label>{t('pages:creator.post.created.urls')}</Label>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{t('pages:creator.post.created.customUrl')}:</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        let url = `${window.location.origin}/${createdPost.slug}`;

                        // Add spatial parameters if available
                        if (createdPost.spatialInfo && createdPost.spatialInfo.latitude && createdPost.spatialInfo.longitude) {
                          const params = new URLSearchParams();

                          if (createdPost.spatialInfo.planet) params.append('planet', createdPost.spatialInfo.planet);
                          params.append('lat', createdPost.spatialInfo.latitude.toString());
                          params.append('lng', createdPost.spatialInfo.longitude.toString());

                          if (createdPost.spatialInfo.altitude !== null && createdPost.spatialInfo.altitude !== undefined) {
                            params.append('altitude', createdPost.spatialInfo.altitude.toString());
                          }

                          if (createdPost.spatialInfo.timestamp) {
                            params.append('timestamp', createdPost.spatialInfo.timestamp);
                          }

                          if (createdPost.spatialInfo.floor !== null && createdPost.spatialInfo.floor !== undefined) {
                            params.append('floor', createdPost.spatialInfo.floor.toString());
                          }

                          url += `?${params.toString()}`;
                        }

                        copyUrl(url, t('pages:creator.post.created.customUrl'));
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="text-xs bg-[#f4f4f5] p-3 rounded-md break-all text-[#94a3b8] font-medium">
                    {(() => {
                      let url = `${window.location.origin}/${createdPost.slug}`;

                      // Add spatial parameters if available
                      if (createdPost.spatialInfo && createdPost.spatialInfo.latitude && createdPost.spatialInfo.longitude) {
                        const params = new URLSearchParams();

                        if (createdPost.spatialInfo.planet) params.append('planet', createdPost.spatialInfo.planet);
                        params.append('lat', createdPost.spatialInfo.latitude.toString());
                        params.append('lng', createdPost.spatialInfo.longitude.toString());

                        if (createdPost.spatialInfo.altitude !== null && createdPost.spatialInfo.altitude !== undefined) {
                          params.append('altitude', createdPost.spatialInfo.altitude.toString());
                        }

                        if (createdPost.spatialInfo.timestamp) {
                          params.append('timestamp', createdPost.spatialInfo.timestamp);
                        }

                        if (createdPost.spatialInfo.floor !== null && createdPost.spatialInfo.floor !== undefined) {
                          params.append('floor', createdPost.spatialInfo.floor.toString());
                        }

                        if (params.toString()) {
                          url += `?${params.toString()}`;
                        }
                      }

                      return url;
                    })()}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{t('pages:creator.post.created.shortUrl')}:</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        let shortUrl = `${window.location.origin}/l/${createdPost.slug}`;

                        // Add spatial parameters in short format if available
                        if (createdPost.spatialInfo && createdPost.spatialInfo.latitude && createdPost.spatialInfo.longitude) {
                          const parts = [
                            createdPost.spatialInfo.planet || 'Earth',
                            createdPost.spatialInfo.latitude.toString(),
                            createdPost.spatialInfo.longitude.toString(),
                            createdPost.spatialInfo.altitude?.toString() || '',
                            createdPost.spatialInfo.timestamp || '',
                            createdPost.spatialInfo.floor?.toString() || ''
                          ];

                          shortUrl += `?${parts.join(',')}`;
                        }

                        copyUrl(shortUrl, t('pages:creator.post.created.shortUrl'));
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="text-xs bg-[#f4f4f5] p-3 rounded-md break-all text-[#94a3b8] font-medium">
                    {(() => {
                      let shortUrl = `${window.location.origin}/l/${createdPost.slug}`;

                      // Add spatial parameters in short format if available
                      if (createdPost.spatialInfo && createdPost.spatialInfo.latitude && createdPost.spatialInfo.longitude) {
                        const parts = [
                          createdPost.spatialInfo.planet || 'Earth',
                          createdPost.spatialInfo.latitude.toString(),
                          createdPost.spatialInfo.longitude.toString(),
                          createdPost.spatialInfo.altitude?.toString() || '',
                          createdPost.spatialInfo.timestamp || '',
                          createdPost.spatialInfo.floor?.toString() || ''
                        ];

                        shortUrl += `?${parts.join(',')}`;
                      }

                      return shortUrl;
                    })()}
                  </div>
                </div>

                {/* Display image if available */}
                {((createdPost.images && createdPost.images.length > 0) || createdPost.image) && (
                  <div className="space-y-3 pt-4">
                    <Label className="text-sm font-bold text-slate-700">{t('pages:creator.post.success.images', 'Post Images')}</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {createdPost.images && createdPost.images.length > 0 ? (
                        createdPost.images.map((img, idx) => (
                          <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200 bg-white">
                            <img
                              src={img}
                              alt={`Post image ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <Button
                                size="sm"
                                variant="secondary"
                                className="h-8 w-8 p-0 rounded-full"
                                onClick={() => downloadImage(img, `post-img-${idx + 1}-${Date.now()}.jpg`)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))
                      ) : (
                        createdPost.image && (
                          <div className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200 bg-white">
                            <img
                              src={createdPost.image}
                              alt="Post image"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Button
                                size="sm"
                                variant="secondary"
                                className="h-8 w-8 p-0 rounded-full"
                                onClick={() => downloadImage(createdPost.image!, `post-img-${Date.now()}.jpg`)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleGenerateQrCode}
                    disabled={!!createdPost.qrCodeUrl}
                  >
                    <QrCodeIcon className="h-4 w-4 mr-1" />
                    {t('pages:creator.generate')}
                  </Button>
                </div>

                {createdPost.qrCodeUrl && (
                  <div className="pt-4">
                    <div className="flex items-center justify-between">
                      <Label>{t('pages:creator.post.qr.title')}</Label>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyUrl(createdPost.qrCodeUrl!, t('pages:creator.post.qr.title'))}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex justify-center p-4 bg-white rounded border">
                      <img
                        src={createdPost.qrCodeUrl}
                        alt={t('pages:creator.post.qr.alt')}
                        className="w-32 h-32"
                      />
                    </div>
                    <div className="flex justify-center mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadImage(createdPost.qrCodeUrl!, `qr-code-${createdPost.slug}-${Date.now()}.png`)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        {t('pages:creator.post.download.buttons.download', 'Download QR Code')}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Download History Section */}
      {downloadedImages.length > 0 && (
        <Card className="rounded-md shadow-none border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                {t('pages:creator.buttons.historyTitle')}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={clearDownloadedImages}
              >
                {t('pages:creator.buttons.clear')}
              </Button>
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="space-y-3">
              {downloadedImages.slice(0, 5).map((image: any) => (
                <div key={image.id} className="flex items-center gap-3 p-2 border rounded">
                  <img
                    src={image.dataUrl}
                    alt={image.filename}
                    className="w-12 h-12 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{image.filename}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(image.downloadedAt).toLocaleDateString()} •
                      {(image.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => downloadImage(image.url, image.filename)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Post Creation Form - Only show if not successful */}
      {!isSuccess && (
        <Card className="rounded-md shadow-none border-slate-200">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-[15px] font-bold text-[#1a2332]">
              <FileText className="h-5 w-5" />
              {t('pages:creator.post.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
            <TabsList className="bg-transparent h-auto p-0 flex gap-6 w-auto border-b-0 mb-6">
              <TabsTrigger value="manual" className="px-0 py-1.5 border-b-2 border-transparent data-[state=active]:border-[#1a2332] data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none text-[14px] font-bold text-[#94a3b8] data-[state=active]:text-[#1a2332] transition-all focus:ring-0 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {t('pages:creator.post.tabs.manual')}
              </TabsTrigger>
              {user?.account_type === 'lawyer' && (
                <TabsTrigger value="ai" className="px-0 py-1.5 border-b-2 border-transparent data-[state=active]:border-[#1a2332] data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none text-[14px] font-bold text-[#94a3b8] data-[state=active]:text-[#1a2332] transition-all focus:ring-0 flex items-center gap-2">
                  <Wand2 className="h-4 w-4" />
                  {t('pages:creator.post.tabs.ai')}
                </TabsTrigger>
              )}
            </TabsList>

            {/* Manual Post Creation */}
            <TabsContent value="manual" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-[13px] font-bold text-[#64748b]">{t('pages:creator.post.fields.title')}</Label>
                <Input
                  id="title"
                  value={postData.title}
                  onChange={(e) => setPostData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder={t('pages:creator.post.placeholders.title')}
                  maxLength={200}
                  className="bg-[#f4f4f5] border-0 h-11 rounded-md px-4 text-[14px] font-medium text-[#1a2332] placeholder:text-[#94a3b8] focus-visible:ring-0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content" className="text-[13px] font-bold text-[#64748b]">{t('pages:creator.post.fields.content')}</Label>
                <Textarea
                  id="content"
                  value={postData.content}
                  onChange={(e) => setPostData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder={t('pages:creator.post.placeholders.content')}
                  rows={8}
                  maxLength={5000}
                  className="bg-[#f4f4f5] border-0 p-4 text-[14px] text-[#1a2332] resize-none rounded-md placeholder:text-[#94a3b8] focus-visible:ring-0"
                />
                <div className="text-xs text-[#94a3b8] text-right">
                  {postData.content.length}/5000 {t('pages:creator.post.characters')}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="image" className="text-[13px] font-bold text-[#64748b]">{t('pages:creator.post.fields.image')}</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  disabled={isUploadingImage || (postData.images && postData.images.length >= 3)}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setSelectedFile(file);
                      handleImageUpload(file);
                    }
                  }}
                  className="bg-[#f4f4f5] border-0 rounded-md h-11 px-4 text-[14px] file:mr-4 file:py-0 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#e2e8f0] file:text-[#1a2332] hover:file:bg-[#cbd5e1] disabled:opacity-50 focus-visible:ring-0"
                />
                {(postData.images && postData.images.length >= 3) && (
                  <p className="text-xs text-amber-600 mt-1">{t('pages:creator.post.image.maxReached', 'Maximum 3 images reached')}</p>
                )}

                {isUploadingImage && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t('pages:creator.post.image.uploading', { progress: uploadProgress })}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {postData.images && postData.images.length > 0 && !isUploadingImage && (
                  <div className="space-y-4">
                    <div className="text-xs text-green-600">
                      {t('pages:creator.post.image.success')}
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {postData.images.map((img, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={img}
                            alt={`${t('pages:creator.post.image.alt')} ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg border border-slate-200"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                            onClick={() => {
                              setPostData(prev => ({ 
                                ...prev, 
                                images: prev.images?.filter((_, i) => i !== index) || [] 
                              }));
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="hashtag" className="text-[13px] font-bold text-[#64748b]">{t('pages:creator.post.fields.hashtag')}</Label>
                <Input
                  id="hashtag"
                  value={postData.hashtag}
                  onChange={(e) => {
                    let value = e.target.value;
                    if (value && !value.startsWith('#')) {
                      value = '#' + value;
                    }
                    setPostData(prev => ({ ...prev, hashtag: value }));
                  }}
                  placeholder={t('pages:creator.post.placeholders.hashtag')}
                  maxLength={100}
                  className="bg-[#f4f4f5] border-0 h-11 rounded-md px-4 text-[14px] font-medium text-[#1a2332] placeholder:text-[#94a3b8] focus-visible:ring-0"
                />
              </div>

              <Button
                onClick={handleNext}
                disabled={!postData.title.trim() || !postData.content.trim()}
                className="w-full bg-[#e2e8f0] hover:bg-[#cbd5e1] text-[#64748b] font-bold h-11 rounded-md text-[14px] shadow-none"
              >
                {t('pages:creator.post.buttons.next')}
              </Button>
            </TabsContent>

            {/* AI Post Generation */}
            <TabsContent value="ai" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prompt" className="text-[13px] font-bold text-[#64748b]">{t('pages:creator.post.ai.fields.prompt')}</Label>
                  <Textarea
                    id="prompt"
                    value={aiData.prompt}
                    onChange={(e) => setAiData(prev => ({ ...prev, prompt: e.target.value }))}
                    placeholder={t('pages:creator.post.ai.placeholders.prompt')}
                    rows={3}
                    maxLength={500}
                    className="bg-[#f4f4f5] border-0 p-4 text-[14px] text-[#1a2332] resize-none rounded-md placeholder:text-[#94a3b8] focus-visible:ring-0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="topic" className="text-[13px] font-bold text-[#64748b]">{t('pages:creator.post.ai.fields.topic')}</Label>
                  <Input
                    id="topic"
                    value={aiData.topic}
                    onChange={(e) => setAiData(prev => ({ ...prev, topic: e.target.value }))}
                    placeholder={t('pages:creator.post.ai.placeholders.topic')}
                    maxLength={200}
                    className="bg-[#f4f4f5] border-0 h-11 rounded-md px-4 text-[14px] font-medium text-[#1a2332] placeholder:text-[#94a3b8] focus-visible:ring-0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label className="text-[13px] font-bold text-[#64748b]">{t('pages:creator.post.ai.fields.tone')}</Label>
                  <Select
                    value={aiData.tone}
                    onValueChange={(value: any) => setAiData(prev => ({ ...prev, tone: value }))}
                  >
                    <SelectTrigger className="bg-[#f4f4f5] border-0 h-10 rounded-md text-[13px] font-medium text-[#64748b] focus:ring-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">{t('pages:creator.post.ai.options.tone.professional')}</SelectItem>
                      <SelectItem value="casual">{t('pages:creator.post.ai.options.tone.casual')}</SelectItem>
                      <SelectItem value="formal">{t('pages:creator.post.ai.options.tone.formal')}</SelectItem>
                      <SelectItem value="friendly">{t('pages:creator.post.ai.options.tone.friendly')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[13px] font-bold text-[#64748b]">{t('pages:creator.post.ai.fields.length')}</Label>
                  <Select
                    value={aiData.length}
                    onValueChange={(value: any) => setAiData(prev => ({ ...prev, length: value }))}
                  >
                    <SelectTrigger className="bg-[#f4f4f5] border-0 h-10 rounded-md text-[13px] font-medium text-[#64748b] focus:ring-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="short">{t('pages:creator.post.ai.options.length.short')}</SelectItem>
                      <SelectItem value="long">{t('pages:creator.post.ai.options.length.long')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[13px] font-bold text-[#64748b]">{t('pages:creator.post.ai.fields.hashtags')}</Label>
                  <Select
                    value={aiData.includeHashtags ? 'yes' : 'no'}
                    onValueChange={(value) => setAiData(prev => ({ ...prev, includeHashtags: value === 'yes' }))}
                  >
                    <SelectTrigger className="bg-[#f4f4f5] border-0 h-10 rounded-md text-[13px] font-medium text-[#64748b] focus:ring-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">{t('pages:creator.post.ai.options.yes')}</SelectItem>
                      <SelectItem value="no">{t('pages:creator.post.ai.options.no')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[13px] font-bold text-[#64748b]">{t('pages:creator.post.ai.fields.language')}</Label>
                  <Select
                    value={aiData.language || 'ko'}
                    onValueChange={(value: 'en' | 'ko') => setAiData(prev => ({ ...prev, language: value }))}
                  >
                    <SelectTrigger className="bg-[#f4f4f5] border-0 h-10 rounded-md text-[13px] font-medium text-[#64748b] focus:ring-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ko">{t('pages:creator.post.ai.options.language.korean')}</SelectItem>
                      <SelectItem value="en">{t('pages:creator.post.ai.options.language.english')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* AI Image Generation Card */}
              <Card className="rounded-md shadow-none border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-[14px] font-bold text-[#1a2332]">
                    <Wand2 className="h-5 w-5" />
                    {t('pages:creator.post.ai.image.cardTitle', 'Generate Image with AI')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="ai-image-prompt" className="text-[13px] font-bold text-[#64748b]">{t('pages:creator.post.ai.image.promptLabel', 'AI Image Prompt')}</Label>
                    <Textarea
                      id="ai-image-prompt"
                      value={aiImagePrompt}
                      onChange={e => setAiImagePrompt(e.target.value)}
                      placeholder={t('pages:creator.post.ai.image.promptPlaceholder', 'Describe the image you want to generate...')}
                      rows={2}
                      maxLength={200}
                      className="bg-[#f4f4f5] border-0 p-4 text-[14px] text-[#1a2332] resize-none rounded-md placeholder:text-[#94a3b8] focus-visible:ring-0"
                    />
                    <Button
                      onClick={handleGenerateAiImage}
                      disabled={isGeneratingImage || !aiImagePrompt.trim()}
                      className="w-full mt-2 bg-[#e2e8f0] hover:bg-[#cbd5e1] text-[#64748b] font-bold h-10 rounded-md text-[13px] shadow-none"
                    >
                      {isGeneratingImage ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {t('pages:creator.post.ai.image.buttons.generating', 'Generating Image...')}
                        </>
                      ) : (
                        <>
                          <Wand2 className="h-4 w-4 mr-2" />
                          {t('pages:creator.post.ai.image.buttons.generate', 'Generate Image')}
                        </>
                      )}
                    </Button>
                    {aiImageUrl && (
                      <div className="space-y-2 pt-2">
                        <Label>{t('pages:creator.post.ai.image.generatedLabel', 'Generated Image')}</Label>
                        <div className="border rounded-lg overflow-hidden">
                          <img src={aiImageUrl} alt="AI generated" className="w-full h-auto max-h-64 object-cover" />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyImageToClipboard(aiImageUrl)}
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            {t('pages:creator.buttons.copyImage')}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setPostData(prev => ({ 
                                ...prev, 
                                image: prev.images?.length === 0 ? aiImageUrl : prev.image,
                                images: addUniqueImage(prev.images || [], aiImageUrl, 3)
                              }));
                              setAiImageUrl(null);
                              toast({
                                title: t('pages:creator.post.image.toast.success'),
                                description: t('pages:creator.post.image.toast.successDesc'),
                                variant: "default",
                              });
                            }}
                            disabled={postData.images && postData.images.length >= 3}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            {t('pages:creator.buttons.addToPost', 'Add to Post')}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadImage(aiImageUrl, `ai-generated-${Date.now()}.jpg`)}
                          >
                            <Download className="h-3 w-3 mr-1" />
                            {t('pages:creator.buttons.download')}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* References Section */}
              <Card className="rounded-md shadow-none border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-[14px] font-bold text-[#1a2332]">
                    <Link className="h-5 w-5" />
                    {t('pages:creator.post.citations.title')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* URL Citation */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-[13px] font-bold text-[#64748b]">
                      <Link className="h-4 w-4" />
                      {t('pages:creator.post.citations.types.url')}
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        value={currentCitations?.find(c => c.type === 'url')?.content || ''}
                        onChange={(e) => {
                          const existingIndex = currentCitations?.findIndex(c => c.type === 'url') ?? -1;
                          if (existingIndex >= 0) {
                            // Update existing URL citation
                            const updatedCitations = [...(currentCitations || [])];
                            updatedCitations[existingIndex] = { ...updatedCitations[existingIndex], content: e.target.value, url: e.target.value };
                            if (activeTab === 'manual') {
                              setPostData(prev => ({ ...prev, citations: updatedCitations }));
                            } else {
                              setAiData(prev => ({ ...prev, citations: updatedCitations }));
                            }
                          } else if (e.target.value.trim()) {
                            // Add new URL citation
                            const newCitation = { type: 'url' as const, content: e.target.value, url: e.target.value };
                            if (activeTab === 'manual') {
                              setPostData(prev => ({ ...prev, citations: [...(prev.citations || []), newCitation] }));
                            } else {
                              setAiData(prev => ({ ...prev, citations: [...(prev.citations || []), newCitation] }));
                            }
                          }
                        }}
                        placeholder={t('pages:creator.post.citations.placeholders.url')}
                        className="flex-1 bg-[#f4f4f5] border-0 h-10 rounded-md px-4 text-[13px] font-medium text-[#1a2332] focus-visible:ring-0"
                      />
                      {currentCitations?.find(c => c.type === 'url') && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            const filteredCitations = currentCitations?.filter(c => c.type !== 'url') || [];
                            if (activeTab === 'manual') {
                              setPostData(prev => ({ ...prev, citations: filteredCitations }));
                            } else {
                              setAiData(prev => ({ ...prev, citations: filteredCitations }));
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* User Citation */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-[13px] font-bold text-[#64748b]">
                      <User className="h-4 w-4" />
                      {t('pages:creator.post.citations.types.user')}
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        value={currentCitations?.find(c => c.type === 'user')?.content || ''}
                        onChange={(e) => {
                          const existingIndex = currentCitations?.findIndex(c => c.type === 'user') ?? -1;
                          if (existingIndex >= 0) {
                            // Update existing user citation with authenticated user's ID
                            const updatedCitations = [...(currentCitations || [])];
                            updatedCitations[existingIndex] = {
                              ...updatedCitations[existingIndex],
                              content: e.target.value,
                              userId: user?._id
                            };
                            if (activeTab === 'manual') {
                              setPostData(prev => ({ ...prev, citations: updatedCitations }));
                            } else {
                              setAiData(prev => ({ ...prev, citations: updatedCitations }));
                            }
                          } else if (e.target.value.trim()) {
                            // Add new user citation with authenticated user's ID
                            const newCitation = {
                              type: 'user' as const,
                              content: e.target.value,
                              userId: user?._id
                            };
                            if (activeTab === 'manual') {
                              setPostData(prev => ({ ...prev, citations: [...(prev.citations || []), newCitation] }));
                            } else {
                              setAiData(prev => ({ ...prev, citations: [...(prev.citations || []), newCitation] }));
                            }
                          }
                        }}
                        placeholder={t('pages:creator.post.citations.placeholders.user')}
                        className="flex-1 bg-[#f4f4f5] border-0 h-10 rounded-md px-4 text-[13px] font-medium text-[#1a2332] focus-visible:ring-0"
                      />
                      {currentCitations?.find(c => c.type === 'user') && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            const filteredCitations = currentCitations?.filter(c => c.type !== 'user') || [];
                            if (activeTab === 'manual') {
                              setPostData(prev => ({ ...prev, citations: filteredCitations }));
                            } else {
                              setAiData(prev => ({ ...prev, citations: filteredCitations }));
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Spatial Citation */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-[13px] font-bold text-[#64748b]">
                      <MapPin className="h-4 w-4" />
                      {t('pages:creator.post.citations.types.spatial')}
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        value={currentCitations?.find(c => c.type === 'spatial')?.content || ''}
                        onChange={(e) => {
                          const existingIndex = currentCitations?.findIndex(c => c.type === 'spatial') ?? -1;
                          if (existingIndex >= 0) {
                            // Update existing spatial citation
                            const updatedCitations = [...(currentCitations || [])];
                            updatedCitations[existingIndex] = { ...updatedCitations[existingIndex], content: e.target.value };
                            if (activeTab === 'manual') {
                              setPostData(prev => ({ ...prev, citations: updatedCitations }));
                            } else {
                              setAiData(prev => ({ ...prev, citations: updatedCitations }));
                            }
                          } else if (e.target.value.trim()) {
                            // Add new spatial citation
                            const newCitation = { type: 'spatial' as const, content: e.target.value };
                            if (activeTab === 'manual') {
                              setPostData(prev => ({ ...prev, citations: [...(prev.citations || []), newCitation] }));
                            } else {
                              setAiData(prev => ({ ...prev, citations: [...(prev.citations || []), newCitation] }));
                            }
                          }
                        }}
                        placeholder={t('pages:creator.post.citations.placeholders.spatial')}
                        className="flex-1 bg-[#f4f4f5] border-0 h-10 rounded-md px-4 text-[13px] font-medium text-[#1a2332] focus-visible:ring-0"
                      />
                      {currentCitations?.find(c => c.type === 'spatial') && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            const filteredCitations = currentCitations?.filter(c => c.type !== 'spatial') || [];
                            if (activeTab === 'manual') {
                              setPostData(prev => ({ ...prev, citations: filteredCitations }));
                            } else {
                              setAiData(prev => ({ ...prev, citations: filteredCitations }));
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                </CardContent>
              </Card>

              <Button
                onClick={handleNext}
                disabled={isGeneratingAi || (!aiData.prompt?.trim() && !aiData.topic?.trim())}
                className="w-full bg-[#e2e8f0] hover:bg-[#cbd5e1] text-[#64748b] font-bold h-11 rounded-md text-[14px] shadow-none"
              >
                {isGeneratingAi ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('pages:creator.post.ai.buttons.generating')}
                  </>
                ) : (
                  <>
                    {t('pages:creator.post.buttons.next')}
                  </>
                )}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      )}

      {/* Location Information Modal */}
      <Dialog open={showLocationModal} onOpenChange={setShowLocationModal}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-200">
            <DialogTitle className="text-[20px] font-bold text-[#0F172A] tracking-tight">
              {t('pages:creator.post.location.title')}
            </DialogTitle>
            <p className="text-sm text-slate-500 mt-1">
              {t('pages:creator.post.location.description')}
            </p>
          </DialogHeader>
          
          <div className="px-6 py-4">
            <LocationUrlGenerator
              onLocationSelect={handleLocationSelect}
              initialData={activeTab === 'manual' ? postData.spatialInfo : aiData.spatialInfo}
              postTitle={activeTab === 'manual' ? postData.title : aiData.topic}
              postImage={activeTab === 'manual' ? postData.image : aiData.image}
            />
          </div>

          <DialogFooter className="px-6 py-4 border-t border-slate-200 bg-slate-50/50">
            <div className="flex items-center justify-end gap-3 w-full">
              <Button
                variant="outline"
                onClick={() => setShowLocationModal(false)}
                className="font-bold h-10 px-6 border-slate-300 text-slate-700 hover:bg-white hover:border-slate-400"
              >
                {t('pages:common.cancel')}
              </Button>
              <Button
                onClick={handleCreatePost}
                disabled={isCreating || !postData.title.trim() || !postData.content.trim()}
                className="bg-[#0F172A] hover:bg-[#1E293B] text-white font-bold h-10 px-6"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('pages:creator.post.buttons.creating')}
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    {t('pages:creator.post.buttons.post')}
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}