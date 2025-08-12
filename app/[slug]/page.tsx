"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getPostBySlug, type Post, type SpatialInfo } from "@/lib/api/posts-api";
import { 
  MapPin, 
  Globe, 
  Mountain, 
  Building, 
  Clock, 
  User, 
  Calendar,
  Hash,
  Copy,
  Share2,
  QrCode,
  ExternalLink,
  Wand2
} from "lucide-react";

export default function PostPage() {
  const params = useParams();
  const { toast } = useToast();
  const slug = params.slug as string;
  
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [spatialInfo, setSpatialInfo] = useState<SpatialInfo | null>(null);

  // Parse URL parameters for spatial info
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      
      // Check if spatial parameters exist
      if (urlParams.has('lat') && urlParams.has('lng')) {
        const spatial: SpatialInfo = {
          planet: urlParams.get('planet') || 'Earth',
          latitude: parseFloat(urlParams.get('lat')!),
          longitude: parseFloat(urlParams.get('lng')!),
          altitude: urlParams.has('altitude') ? parseFloat(urlParams.get('altitude')!) : undefined,
          timestamp: urlParams.has('timestamp') ? urlParams.get('timestamp')! : undefined,
          floor: urlParams.has('floor') ? parseInt(urlParams.get('floor')!) : undefined
        };
        setSpatialInfo(spatial);
      }
      
      // Check for short URL format
      const queryString = window.location.search.slice(1);
      if (queryString && !queryString.includes('=')) {
        const parts = queryString.split(',');
        if (parts.length >= 3) {
          const spatial: SpatialInfo = {
            planet: parts[0] || 'Earth',
            latitude: parts[1] ? parseFloat(parts[1]) : undefined,
            longitude: parts[2] ? parseFloat(parts[2]) : undefined,
            altitude: parts[3] ? parseFloat(parts[3]) : undefined,
            timestamp: parts[4] || undefined,
            floor: parts[5] ? parseInt(parts[5]) : undefined
          };
          setSpatialInfo(spatial);
        }
      }
    }
  }, []);

  // Fetch post data
  useEffect(() => {
    const fetchPost = async () => {
      try {
        setIsLoading(true);
        
        // Check if there's an ID parameter for direct access
        const urlParams = new URLSearchParams(window.location.search);
        const postId = urlParams.get('id');
        
        let response;
        if (postId) {
          // Fetch by ID if available
          const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
          const user = localStorage.getItem('user');
          const token = user ? JSON.parse(user).token : null;
          
          if (!token) {
            throw new Error('Authentication required');
          }
          
          response = await fetch(`${baseUrl}/api/v1/post/id/${postId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const data = await response.json();
          if (data.success) {
            response = { data: data.data };
          } else {
            throw new Error(data.message || 'Failed to fetch post');
          }
        } else {
          // Fetch by slug
          response = await getPostBySlug(slug);
        }
        
        setPost(response.data);
      } catch (error: any) {
        toast({
          title: "Post not found",
          description: error.message || "The requested post could not be found",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) {
      fetchPost();
    }
  }, [slug, toast]);

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format spatial timestamp
  const formatSpatialTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };

  // Copy URL to clipboard
  const copyUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "URL copied",
      description: "Post URL copied to clipboard",
      variant: "default",
    });
  };

  // Get address from coordinates (mock implementation)
  const getAddressFromCoords = (lat: number, lng: number) => {
    // In a real implementation, you would use Google Geocoding API
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading post...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Post Not Found</h1>
            <p className="text-gray-600">The requested post could not be found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Post Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-2xl lg:text-3xl mb-4">{post.title}</CardTitle>
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <Badge variant={post.status === 'published' ? 'default' : 'secondary'}>
                    {post.status}
                  </Badge>
                  {post.isAiGenerated && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Wand2 className="h-3 w-3" />
                      AI Generated
                    </Badge>
                  )}
                  {(spatialInfo?.latitude || post.spatialInfo?.latitude) && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Location Data
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {post.author.first_name} {post.author.last_name}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDate(post.createdAt)}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
          
                
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Spatial Information Display */}
        {(spatialInfo?.latitude || post.spatialInfo?.latitude) && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Coordinates */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">Location</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <div>Planet: {spatialInfo?.planet || post.spatialInfo?.planet || 'Earth'}</div>
                    <div>
                      Coordinates: {spatialInfo?.latitude || post.spatialInfo?.latitude}, {spatialInfo?.longitude || post.spatialInfo?.longitude}
                    </div>
                    <div className="text-xs text-gray-500">
                      {getAddressFromCoords(
                        spatialInfo?.latitude || post.spatialInfo?.latitude || 0,
                        spatialInfo?.longitude || post.spatialInfo?.longitude || 0
                      )}
                    </div>
                  </div>
                </div>

                {/* Altitude */}
                {(spatialInfo?.altitude !== undefined || post.spatialInfo?.altitude !== undefined) && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Mountain className="h-4 w-4 text-green-500" />
                      <span className="font-medium">Altitude</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {spatialInfo?.altitude || post.spatialInfo?.altitude}m above sea level
                    </div>
                  </div>
                )}

                {/* Floor */}
                {(spatialInfo?.floor !== undefined || post.spatialInfo?.floor !== undefined) && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-purple-500" />
                      <span className="font-medium">Floor</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {(spatialInfo?.floor !== undefined ? spatialInfo.floor : post.spatialInfo?.floor || 0) >= 0 
                        ? `Floor ${spatialInfo?.floor !== undefined ? spatialInfo.floor : post.spatialInfo?.floor || 0}`
                        : `Basement ${Math.abs(spatialInfo?.floor !== undefined ? spatialInfo.floor : post.spatialInfo?.floor || 0)}`
                      }
                    </div>
                  </div>
                )}

                {/* Timestamp */}
                {(spatialInfo?.timestamp || post.spatialInfo?.timestamp) && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-orange-500" />
                      <span className="font-medium">Specific Time</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatSpatialTimestamp(spatialInfo?.timestamp || post.spatialInfo?.timestamp || '')}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Post Image */}
        {post.image && (
          <Card className="mb-6">
            <CardContent className="p-0">
              <div className="relative w-full h-64 rounded-lg overflow-hidden">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Post Content */}
        <Card className="mb-6">
          <CardContent className="py-6">
            <div className="prose max-w-none">
              <div 
                className="text-gray-800 leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: post.content
                    .replace(/\n/g, '<br>')
                    .replace(/### (.*?)\n/g, '<h3 class="text-xl font-bold mt-6 mb-3 text-gray-900">$1</h3>')
                    .replace(/#### (.*?)\n/g, '<h4 class="text-lg font-semibold mt-4 mb-2 text-gray-800">$1</h4>')
                    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
                    .replace(/- (.*?)\n/g, '<li class="ml-4">$1</li>')
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Hashtags */}
        {((post.hashtags && post.hashtags.length > 0) || post.hashtag) && (
          <Card className="mb-6">
            <CardContent className="py-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Hash className="h-4 w-4 text-blue-500" />
                {post.hashtags && post.hashtags.length > 0 ? (
                  post.hashtags.map((tag, index) => (
                    <span key={index} className="text-blue-500 font-medium">
                      {tag}{index < post.hashtags!.length - 1 ? ', ' : ''}
                    </span>
                  ))
                ) : (
                  <span className="text-blue-500 font-medium">{post.hashtag}</span>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Useful Links */}
        {post.usefulLinks && post.usefulLinks.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="h-5 w-5" />
                Useful Resources
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {post.usefulLinks.map((link, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <a 
                      href={link.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <div className="flex items-start gap-3">
                        <ExternalLink className="h-4 w-4 text-blue-500 mt-1 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium text-blue-600 hover:text-blue-800 underline">
                            {link.title}
                          </h4>
                          {link.description && (
                            <p className="text-sm text-gray-600 mt-1">{link.description}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">{link.url}</p>
                        </div>
                      </div>
                    </a>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Citations */}
        {post.citations && post.citations.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Citations & References</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {post.citations.map((citation, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <Badge variant="outline" className="mt-1">
                      {citation.type === 'spatial' && <MapPin className="h-3 w-3 mr-1" />}
                      {citation.type === 'user' && <User className="h-3 w-3 mr-1" />}
                      {citation.type === 'url' && <ExternalLink className="h-3 w-3 mr-1" />}
                      {citation.type}
                    </Badge>
                    <div className="flex-1">
                      <div className="text-sm">{citation.content}</div>
                      {citation.type === 'url' && citation.url && (
                        <a 
                          href={citation.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-blue-500 hover:underline"
                        >
                          {citation.url}
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* QR Code */}
        {post.qrCodeUrl && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                QR Code
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <img 
                src={post.qrCodeUrl} 
                alt="QR Code for this post" 
                className="mx-auto max-w-48 max-h-48"
              />
              <p className="text-sm text-gray-500 mt-2">
                Scan to share this post
              </p>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>
            This post was {post.isAiGenerated ? 'generated with AI assistance' : 'manually created'} by {post.author.first_name} {post.author.last_name}
          </p>
          {post.isAiGenerated && post.aiPrompt && (
            <p className="mt-1">
              AI Prompt: "{post.aiPrompt}"
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
