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
  createPost, 
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
  const [isCreating, setIsCreating] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [createdPost, setCreatedPost] = useState<Post | null>(null);
  
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
      reader.onload = function(e) {
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
        setPostData(prev => ({ ...prev, image: imageUrl }));
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
  const handleCreatePost = async () => {
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
      const response = await createPost(postData);
      const post = response.data;
      
      setCreatedPost(post);
      onPostCreated?.(post);
      
      toast({
        title: t('pages:creator.post.toast.created'),
        description: t('pages:creator.post.toast.createdDesc', { title: post.title }),
        variant: "default",
      });

      // Reset form
      setPostData({
        title: '',
        content: '',
        spatialInfo: undefined,
        citations: [],
        hashtag: '',
        status: 'published'
      });
      
      setSelectedFile(null);

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
      const post = response.data;
      
      setCreatedPost(post);
      onPostCreated?.(post);
      
      toast({
        title: t('pages:creator.post.ai.toast.generated'),
        description: t('pages:creator.post.ai.toast.generatedDesc', { title: post.title }),
        variant: "default",
      });

      setAiData({
        prompt: '',
        topic: '',
        tone: 'professional',
        length: 'long',
        includeHashtags: true,
        spatialInfo: undefined,
        citations: []
      });
      
      setPostData(prev => ({ ...prev, image: undefined }));
      setSelectedFile(null);

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
      setPostData(prev => ({ ...prev, image: response.data.imageUrl }));
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
    <div className="space-y-6">
      {/* Created Post Display - Now at the top */}
      {createdPost && (
        <Card className="border-green-200 bg-green-50">
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
                  <div className="text-xs bg-gray-50 p-2 rounded break-all">
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
                  <div className="text-xs bg-gray-50 p-2 rounded break-all">
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
                {createdPost.image && (
                  <div className="space-y-2 pt-4">
                    <Label>Post Image</Label>
                    <div className="border rounded-lg overflow-hidden">
                      <img 
                        src={createdPost.image} 
                        alt="Post image"
                        className="w-full h-auto max-h-64 object-cover"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadImage(createdPost.image!, `post-${createdPost.slug}-${Date.now()}.jpg`)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        {t('pages:creator.post.download.buttons.download', 'Download Image')}
                      </Button>
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
        <Card>
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

      {/* Post Creation Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t('pages:creator.post.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {t('pages:creator.post.tabs.manual')}
              </TabsTrigger>
              <TabsTrigger value="ai" className="flex items-center gap-2">
                <Wand2 className="h-4 w-4" />
                {t('pages:creator.post.tabs.ai')}
              </TabsTrigger>
            </TabsList>

            {/* Manual Post Creation */}
            <TabsContent value="manual" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">{t('pages:creator.post.fields.title')}</Label>
                <Input
                  id="title"
                  value={postData.title}
                  onChange={(e) => setPostData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder={t('pages:creator.post.placeholders.title')}
                  maxLength={200}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">{t('pages:creator.post.fields.content')}</Label>
                <Textarea
                  id="content"
                  value={postData.content}
                  onChange={(e) => setPostData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder={t('pages:creator.post.placeholders.content')}
                  rows={8}
                  maxLength={5000}
                />
                <div className="text-xs text-gray-500 text-right">
                  {postData.content.length}/5000 {t('pages:creator.post.characters')}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="image">{t('pages:creator.post.fields.image')}</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  disabled={isUploadingImage}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setSelectedFile(file);
                      handleImageUpload(file);
                    }
                  }}
                  className="file:mr-4 file:py-0 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                />
                
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
                
                {postData.image && !isUploadingImage && (
                  <div className="space-y-2">
                    <div className="text-xs text-green-600">
                      {t('pages:creator.post.image.success')}
                    </div>
                    <div className="relative">
                      <img 
                        src={postData.image} 
                        alt={t('pages:creator.post.image.alt')} 
                        className="w-full max-w-xs h-32 object-cover rounded-lg border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-1 right-1 h-6 w-6 p-0"
                        onClick={() => {
                          setPostData(prev => ({ ...prev, image: undefined }));
                          setSelectedFile(null);
                        }}
                      >
                        ×
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadImage(postData.image!, `post-image-${Date.now()}.jpg`)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        {t('pages:creator.post.download.buttons.download', 'Download Image')}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="hashtag">{t('pages:creator.post.fields.hashtag')}</Label>
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
                />
              </div>

              <Button 
                onClick={handleCreatePost} 
                disabled={isCreating || !postData.title.trim() || !postData.content.trim()}
                className="w-full"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('pages:creator.post.buttons.creating')}
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    {t('pages:creator.post.buttons.create')}
                  </>
                )}
              </Button>
            </TabsContent>

            {/* AI Post Generation */}
            <TabsContent value="ai" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prompt">{t('pages:creator.post.ai.fields.prompt')}</Label>
                  <Textarea
                    id="prompt"
                    value={aiData.prompt}
                    onChange={(e) => setAiData(prev => ({ ...prev, prompt: e.target.value }))}
                    placeholder={t('pages:creator.post.ai.placeholders.prompt')}
                    rows={3}
                    maxLength={500}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="topic">{t('pages:creator.post.ai.fields.topic')}</Label>
                  <Input
                    id="topic"
                    value={aiData.topic}
                    onChange={(e) => setAiData(prev => ({ ...prev, topic: e.target.value }))}
                    placeholder={t('pages:creator.post.ai.placeholders.topic')}
                    maxLength={200}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>{t('pages:creator.post.ai.fields.tone')}</Label>
                  <Select 
                    value={aiData.tone} 
                    onValueChange={(value: any) => setAiData(prev => ({ ...prev, tone: value }))}
                  >
                    <SelectTrigger>
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
                  <Label>{t('pages:creator.post.ai.fields.length')}</Label>
                  <Select 
                    value={aiData.length} 
                    onValueChange={(value: any) => setAiData(prev => ({ ...prev, length: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="short">{t('pages:creator.post.ai.options.length.short')}</SelectItem>
                      <SelectItem value="long">{t('pages:creator.post.ai.options.length.long')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t('pages:creator.post.ai.fields.hashtags')}</Label>
                  <Select 
                    value={aiData.includeHashtags ? 'yes' : 'no'} 
                    onValueChange={(value) => setAiData(prev => ({ ...prev, includeHashtags: value === 'yes' }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">{t('pages:creator.post.ai.options.yes')}</SelectItem>
                      <SelectItem value="no">{t('pages:creator.post.ai.options.no')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t('pages:creator.post.ai.fields.language')}</Label>
                  <Select 
                    value={aiData.language || 'ko'} 
                    onValueChange={(value: 'en' | 'ko') => setAiData(prev => ({ ...prev, language: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ko">{t('pages:creator.post.ai.options.language.korean')}</SelectItem>
                      <SelectItem value="en">{t('pages:creator.post.ai.options.language.english')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* References Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Link className="h-5 w-5" />
                    {t('pages:creator.post.citations.title')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* URL Citation */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
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
                        className="flex-1"
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
                    <Label className="flex items-center gap-2">
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
                        className="flex-1"
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
                    <Label className="flex items-center gap-2">
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
                        className="flex-1"
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

              {/* AI Image Generation Card - moved below References */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wand2 className="h-5 w-5" />
                    {t('pages:creator.post.ai.image.cardTitle', 'Generate Image with AI')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="ai-image-prompt">{t('pages:creator.post.ai.image.promptLabel', 'AI Image Prompt')}</Label>
                    <Textarea
                      id="ai-image-prompt"
                      value={aiImagePrompt}
                      onChange={e => setAiImagePrompt(e.target.value)}
                      placeholder={t('pages:creator.post.ai.image.promptPlaceholder', 'Describe the image you want to generate...')}
                      rows={2}
                      maxLength={200}
                    />
                    <Button
                      onClick={handleGenerateAiImage}
                      disabled={isGeneratingImage || !aiImagePrompt.trim()}
                      className="w-full"
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
                            onClick={() => copyUrl(aiImageUrl, t('pages:creator.post.ai.image.generatedLabel', 'Generated Image'))}
                          >
                            <Link className="h-3 w-3 mr-1" />
                            {t('pages:creator.buttons.copyUrl')}
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

              <Button 
                onClick={handleGenerateAiPost} 
                disabled={isGeneratingAi || (!aiData.prompt?.trim() && !aiData.topic?.trim())}
                className="w-full"
              >
                {isGeneratingAi ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('pages:creator.post.ai.buttons.generating')}
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    {t('pages:creator.post.ai.buttons.generate')}
                  </>
                )}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Location & Spatial Information */}
      <LocationUrlGenerator 
        onLocationSelect={handleLocationSelect}
        initialData={activeTab === 'manual' ? postData.spatialInfo : aiData.spatialInfo}
        postTitle={activeTab === 'manual' ? postData.title : aiData.topic}
        postImage={activeTab === 'manual' ? postData.image : aiData.image}
      />
    </div>
  );
}