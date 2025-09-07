"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
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
  Wand2,
  FileText,
  Scale,
  BookOpen,
  Link,
  CheckCircle
} from "lucide-react";

export default function PostPage() {
  const params = useParams();
  const { toast } = useToast();
  const { t } = useTranslation();
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
        
        // Fetch by slug (title-based URL)
        const response = await getPostBySlug(slug);
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

  // Format date with Korean locale support
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format spatial timestamp with Korean locale support
  const formatSpatialTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('ko-KR', {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-5xl mx-auto py-8 px-4">
        {/* Professional Legal Post Header */}
        <Card className="mb-8 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Scale className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <Badge variant={post.status === 'published' ? 'default' : 'secondary'} className="mb-1">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {post.status === 'published' ? '게시됨' : post.status}
                    </Badge>
                    <div className="flex items-center gap-2">
                      {post.isAiGenerated && (
                        <Badge variant="outline" className="flex items-center gap-1 text-purple-600 border-purple-200">
                          <Wand2 className="h-3 w-3" />
                          AI 생성
                        </Badge>
                      )}
                      {(spatialInfo?.latitude || post.spatialInfo?.latitude) && (
                        <Badge variant="outline" className="flex items-center gap-1 text-green-600 border-green-200">
                          <MapPin className="h-3 w-3" />
                          위치 정보
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <CardTitle className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6 leading-tight">
                  {post.title}
                </CardTitle>
                <div className="flex items-center gap-6 text-gray-600 bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {post.author.first_name} {post.author.last_name}
                      </div>
                      <div className="text-sm text-gray-500">법무 전문가</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{formatDate(post.createdAt)}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyUrl}>
                  <Copy className="h-4 w-4 mr-1" />
                  URL 복사
                </Button>
                <Button variant="outline" size="sm">
                  <Share2 className="h-4 w-4 mr-1" />
                  공유
                </Button>
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

        {/* Professional Legal Content */}
        <Card className="mb-8 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl text-gray-900">
              <FileText className="h-5 w-5 text-blue-600" />
              법률 내용
            </CardTitle>
          </CardHeader>
          <CardContent className="py-6">
            <div className="prose max-w-none">
              <div 
                className="text-gray-800 leading-relaxed text-lg"
                style={{ lineHeight: '1.8' }}
                dangerouslySetInnerHTML={{
                  __html: post.content
                    .replace(/\n/g, '<br>')
                    .replace(/### (.*?)\n/g, '<h3 class="text-2xl font-bold mt-8 mb-4 text-gray-900 border-l-4 border-blue-500 pl-4">$1</h3>')
                    .replace(/#### (.*?)\n/g, '<h4 class="text-xl font-semibold mt-6 mb-3 text-gray-800">$1</h4>')
                    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900 bg-yellow-100 px-1 rounded">$1</strong>')
                    .replace(/- (.*?)\n/g, '<li class="ml-6 mb-2 text-gray-700">$1</li>')
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Professional Hashtags Section */}
        {((post.hashtags && post.hashtags.length > 0) || post.hashtag) && (
          <Card className="mb-8 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
                <Hash className="h-5 w-5 text-blue-600" />
                관련 태그
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 flex-wrap">
                {post.hashtags && post.hashtags.length > 0 ? (
                  post.hashtags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="px-3 py-1 text-sm bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100">
                      #{tag}
                    </Badge>
                  ))
                ) : (
                  <Badge variant="secondary" className="px-3 py-1 text-sm bg-blue-50 text-blue-700 border border-blue-200">
                    #{post.hashtag}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Professional Legal Resources */}
        {post.usefulLinks && post.usefulLinks.length > 0 && (
          <Card className="mb-8 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl text-gray-900">
                <BookOpen className="h-5 w-5 text-green-600" />
                유용한 법률 자료
              </CardTitle>
              <p className="text-gray-600 text-sm mt-1">관련 법률 정보 및 참고 자료</p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {post.usefulLinks.map((link, index) => (
                  <div key={index} className="group p-5 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-100 hover:border-green-200 hover:shadow-md transition-all duration-200">
                    <a 
                      href={link.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                          <Link className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 group-hover:text-green-700 transition-colors text-lg mb-2">
                            {link.title}
                          </h4>
                          {link.description && (
                            <p className="text-gray-700 mb-3 leading-relaxed">{link.description}</p>
                          )}
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs bg-white/50">
                              <ExternalLink className="h-3 w-3 mr-1" />
                              외부 링크
                            </Badge>
                            <span className="text-xs text-gray-500 truncate max-w-md">{link.url}</span>
                          </div>
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

        {/* QR Code Section */}
        {post.qrCodeUrl && (
          <Card className="mb-8 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
                <QrCode className="h-5 w-5 text-purple-600" />
                QR 코드로 공유
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="p-6 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl inline-block">
                <img 
                  src={post.qrCodeUrl} 
                  alt="이 게시물의 QR 코드" 
                  className="mx-auto max-w-48 max-h-48 rounded-lg shadow-sm"
                />
              </div>
              <p className="text-sm text-gray-600 mt-4 font-medium">
                QR 코드를 스캔하여 이 게시물을 공유하세요
              </p>
            </CardContent>
          </Card>
        )}

        {/* Professional Footer */}
        <Card className="border-0 shadow-lg bg-gradient-to-r from-slate-50 to-blue-50">
          <CardContent className="py-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
                <span className="font-medium text-gray-900">
                  {post.author.first_name} {post.author.last_name}
                </span>
                <Badge variant="outline" className="ml-2">
                  법무 전문가
                </Badge>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                이 게시물은 {post.isAiGenerated ? 'AI 도움을 받아 생성' : '직접 작성'}되었습니다
              </p>
              {post.isAiGenerated && post.aiPrompt && (
                <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-100">
                  <p className="text-xs text-purple-700 font-medium mb-1">AI 프롬프트:</p>
                  <p className="text-sm text-purple-800 italic">
                    "{post.aiPrompt}"
                  </p>
                </div>
              )}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  © {new Date().getFullYear()} 법률 정보 플랫폼. 모든 권리 보유.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
