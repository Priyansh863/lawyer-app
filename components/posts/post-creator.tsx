"use client";

import { useState, useEffect } from "react";
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
import { 
  createPost, 
  generateAiPost, 
  generateQrCode,
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
  QrCode, 
  Share2, 
  Copy,
  Hash,
  MapPin,
  User,
  Link,
  Plus,
  Trash2
} from "lucide-react";

interface PostCreatorProps {
  onPostCreated?: (post: Post) => void;
  initialData?: Partial<CreatePostData>;
}

export default function PostCreator({ onPostCreated, initialData }: PostCreatorProps) {
  const { toast } = useToast();
  const { t } = useTranslation();
  
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
    spatialInfo: undefined,
    citations: []
  });

  // Citations management
  const [newCitation, setNewCitation] = useState<Citation>({
    type: 'url',
    content: ''
  });

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

    const citation: Citation = {
      ...newCitation,
      content: newCitation.content.trim()
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
      
      // Create file path with timestamp
      const timestamp = new Date().getTime();
      const filePath = `posts/${timestamp}-${file.name}`;
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 100);
      
      // Upload to S3
      const imageUrl = await uploadFileOnS3(file, filePath);
      
      // Complete progress
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
      
      // Reset image
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
      
      // Include image if uploaded
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

      // Reset form
      setAiData({
        prompt: '',
        topic: '',
        tone: 'professional',
        length: 'long',
        includeHashtags: true,
        spatialInfo: undefined,
        citations: []
      });
      
      // Reset image
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

      // Update created post with QR code
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

  const currentCitations = activeTab === 'manual' ? postData.citations : aiData.citations;

  return (
    <div className="space-y-6">
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
                  className="file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
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
                      {t('post.image.success')}
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
              </div>

              {/* Image Upload for AI */}
              <div className="space-y-2">
                <Label htmlFor="ai-image">{t('pages:creator.post.fields.image')}</Label>
                <Input
                  id="ai-image"
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
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
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
                  </div>
                )}
              </div>

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

      {/* Citations Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            {t('pages:creator.post.citations.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Citation */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <Select 
              value={newCitation.type} 
              onValueChange={(value: any) => setNewCitation(prev => ({ ...prev, type: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="spatial">{t('pages:creator.post.citations.types.spatial')}</SelectItem>
                <SelectItem value="user">{t('pages:creator.post.citations.types.user')}</SelectItem>
                <SelectItem value="url">{t('pages:creator.post.citations.types.url')}</SelectItem>
              </SelectContent>
            </Select>

            <Input
              value={newCitation.content}
              onChange={(e) => setNewCitation(prev => ({ ...prev, content: e.target.value }))}
              placeholder={
                newCitation.type === 'user' ? t('pages:creator.post.citations.placeholders.user') :
                newCitation.type === 'url' ? t('pages:creator.post.citations.placeholders.url') :
                t('pages:creator.post.citations.placeholders.spatial')
              }
              className="md:col-span-2"
            />

            <Button onClick={addCitation} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              {t('pages:creator.post.citations.buttons.add')}
            </Button>
          </div>

          {/* Citations List */}
          {currentCitations && currentCitations.length > 0 && (
            <div className="space-y-2">
              <Label>{t('pages:creator.post.citations.added')}</Label>
              {currentCitations.map((citation, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {citation.type === 'spatial' && <MapPin className="h-3 w-3 mr-1" />}
                      {citation.type === 'user' && <User className="h-3 w-3 mr-1" />}
                      {citation.type === 'url' && <Link className="h-3 w-3 mr-1" />}
                      {t(`pages:creator.post.citations.types.${citation.type}`)}
                    </Badge>
                    <span className="text-sm">{citation.content}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeCitation(index)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Location & Spatial Information */}
      <LocationUrlGenerator 
        onLocationSelect={handleLocationSelect}
        initialData={activeTab === 'manual' ? postData.spatialInfo : aiData.spatialInfo}
      />

      {/* Created Post Display */}
      {createdPost && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {t('pages:creator.post.created.title')}
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

            {createdPost.customUrl && (
              <div className="space-y-2">
                <Label>{t('pages:creator.post.created.urls')}</Label>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{t('pages:creator.post.created.customUrl')}:</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyUrl(createdPost.customUrl!, t('pages:creator.post.created.customUrl'))}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="text-xs bg-gray-50 p-2 rounded break-all">
                    {createdPost.customUrl}
                  </div>
                </div>

                {createdPost.shortUrl && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{t('pages:creator.post.created.shortUrl')}:</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyUrl(createdPost.shortUrl!, t('pages:creator.post.created.shortUrl'))}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="text-xs bg-gray-50 p-2 rounded break-all">
                      {createdPost.shortUrl}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}