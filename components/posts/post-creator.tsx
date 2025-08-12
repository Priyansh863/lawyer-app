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
        title: "Citation required",
        description: "Please enter citation content",
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
          title: "Image uploaded successfully",
          description: "Your image has been uploaded and will be included in the post",
          variant: "default",
        });
      } else {
        throw new Error('Failed to get image URL');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
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
        title: "Missing required fields",
        description: "Title and content are required",
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
        title: "Post created successfully",
        description: `Your post "${post.title}" has been created`,
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
        title: "Failed to create post",
        description: error.message || "Something went wrong",
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
        title: "Missing input",
        description: "Please provide either a prompt or topic",
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
        title: "AI post generated successfully",
        description: `Generated post: "${post.title}"`,
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
        title: "Failed to generate AI post",
        description: error.message || "Something went wrong",
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
        title: "QR code generated",
        description: "QR code has been generated for your post",
        variant: "default",
      });

      // Update created post with QR code
      setCreatedPost(prev => prev ? { ...prev, qrCodeUrl: response.data.qrCodeUrl } : null);

    } catch (error: any) {
      toast({
        title: "Failed to generate QR code",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    }
  };

  // Copy URL to clipboard
  const copyUrl = (url: string, type: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "URL copied",
      description: `${type} URL copied to clipboard`,
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
            Create New Post
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Manual Post
              </TabsTrigger>
              <TabsTrigger value="ai" className="flex items-center gap-2">
                <Wand2 className="h-4 w-4" />
                AI Generated
              </TabsTrigger>
            </TabsList>

            {/* Manual Post Creation */}
            <TabsContent value="manual" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={postData.title}
                  onChange={(e) => setPostData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter post title..."
                  maxLength={200}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={postData.content}
                  onChange={(e) => setPostData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Write your post content..."
                  rows={8}
                  maxLength={5000}
                />
                <div className="text-xs text-gray-500 text-right">
                  {postData.content.length}/5000 characters
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="image">Image (optional)</Label>
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
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                />
                
                {isUploadingImage && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading image... {uploadProgress}%
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
                      ✅ Image uploaded successfully
                    </div>
                    <div className="relative">
                      <img 
                        src={postData.image} 
                        alt="Uploaded preview" 
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
                <Label htmlFor="hashtag">Hashtag (optional)</Label>
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
                  placeholder="#LegalAdvice"
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
                    Creating Post...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Create Post
                  </>
                )}
              </Button>
            </TabsContent>

            {/* AI Post Generation */}
            <TabsContent value="ai" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prompt">AI Prompt</Label>
                  <Textarea
                    id="prompt"
                    value={aiData.prompt}
                    onChange={(e) => setAiData(prev => ({ ...prev, prompt: e.target.value }))}
                    placeholder="Describe what you want the AI to write about..."
                    rows={3}
                    maxLength={500}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="topic">Or Topic</Label>
                  <Input
                    id="topic"
                    value={aiData.topic}
                    onChange={(e) => setAiData(prev => ({ ...prev, topic: e.target.value }))}
                    placeholder="Contract Law Basics"
                    maxLength={200}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Tone</Label>
                  <Select 
                    value={aiData.tone} 
                    onValueChange={(value: any) => setAiData(prev => ({ ...prev, tone: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="formal">Formal</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Length</Label>
                  <Select 
                    value={aiData.length} 
                    onValueChange={(value: any) => setAiData(prev => ({ ...prev, length: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="short">Short (400-600 words)</SelectItem>
                      <SelectItem value="long">Long (800-1200 words)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Include Hashtags</Label>
                  <Select 
                    value={aiData.includeHashtags ? 'yes' : 'no'} 
                    onValueChange={(value) => setAiData(prev => ({ ...prev, includeHashtags: value === 'yes' }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Image Upload for AI */}
              <div className="space-y-2">
                <Label htmlFor="ai-image">Image (optional)</Label>
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
                      Uploading image... {uploadProgress}%
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
                      ✅ Image uploaded successfully
                    </div>
                    <div className="relative">
                      <img 
                        src={postData.image} 
                        alt="Uploaded preview" 
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
                    Generating AI Post...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Generate AI Post
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
            Citations
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
                <SelectItem value="spatial">Spatial Info</SelectItem>
                <SelectItem value="user">User (@mention)</SelectItem>
                <SelectItem value="url">URL</SelectItem>
              </SelectContent>
            </Select>

            <Input
              value={newCitation.content}
              onChange={(e) => setNewCitation(prev => ({ ...prev, content: e.target.value }))}
              placeholder={
                newCitation.type === 'user' ? '@username' :
                newCitation.type === 'url' ? 'https://example.com' :
                'Spatial reference'
              }
              className="md:col-span-2"
            />

            <Button onClick={addCitation} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>

          {/* Citations List */}
          {currentCitations && currentCitations.length > 0 && (
            <div className="space-y-2">
              <Label>Added Citations</Label>
              {currentCitations.map((citation, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {citation.type === 'spatial' && <MapPin className="h-3 w-3 mr-1" />}
                      {citation.type === 'user' && <User className="h-3 w-3 mr-1" />}
                      {citation.type === 'url' && <Link className="h-3 w-3 mr-1" />}
                      {citation.type}
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
              Created Post
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
                <Label>Generated URLs</Label>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Custom URL:</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyUrl(createdPost.customUrl!, 'Custom')}
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
                      <span className="text-sm font-medium">Short URL:</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyUrl(createdPost.shortUrl!, 'Short')}
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
