"use client"

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  MapPin,
  Mountain,
  Clock,
  Building,
  Globe,
  QrCode,
  ExternalLink,
  Copy,
  Hash,
  AtSign,
  Link as LinkIcon
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export interface SpatialInfo {
  planet?: string
  latitude?: number
  longitude?: number
  altitude?: number
  timestamp?: string
  floor?: number
}

export interface Citation {
  type: 'spatial' | 'user' | 'url'
  content: string
  spatialInfo?: SpatialInfo
  userId?: string
  url?: string
}

interface SpatialDisplayProps {
  spatialInfo?: SpatialInfo
  citations?: Citation[]
  hashtag?: string
  slug?: string
  customUrl?: string
  shortUrl?: string
  qrCodeUrl?: string
  showQrCode?: boolean
  compact?: boolean
}

export default function SpatialDisplay({
  spatialInfo,
  citations = [],
  hashtag,
  slug,
  customUrl,
  shortUrl,
  qrCodeUrl,
  showQrCode = true,
  compact = false
}: SpatialDisplayProps) {
  const hasLocation = spatialInfo?.latitude && spatialInfo?.longitude

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // You might want to show a toast notification here
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  const formatCoordinate = (value: number, type: 'lat' | 'lng'): string => {
    const direction = type === 'lat' 
      ? (value >= 0 ? 'N' : 'S')
      : (value >= 0 ? 'E' : 'W')
    return `${Math.abs(value).toFixed(6)}° ${direction}`
  }

  const formatTimestamp = (timestamp: string): string => {
    try {
      const date = new Date(timestamp)
      return date.toLocaleString()
    } catch {
      return timestamp
    }
  }

  if (!hasLocation && citations.length === 0 && !hashtag) {
    return null
  }

  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {hasLocation && (
          <Badge variant="outline" className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {spatialInfo.planet || 'Earth'}
          </Badge>
        )}
        
        {spatialInfo?.altitude && (
          <Badge variant="outline" className="flex items-center gap-1">
            <Mountain className="h-3 w-3" />
            {spatialInfo.altitude}m
          </Badge>
        )}
        
        {spatialInfo?.floor && (
          <Badge variant="outline" className="flex items-center gap-1">
            <Building className="h-3 w-3" />
            Floor {spatialInfo.floor}
          </Badge>
        )}
        
        {hashtag && (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Hash className="h-3 w-3" />
            {hashtag.replace('#', '')}
          </Badge>
        )}
        
        {citations.length > 0 && (
          <Badge variant="outline">
            {citations.length} citation{citations.length > 1 ? 's' : ''}
          </Badge>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Spatial Information */}
      {hasLocation && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold">Location Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Planet:</span>
                  <span className="text-sm">{spatialInfo.planet || 'Earth'}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Coordinates:</span>
                  <span className="text-sm font-mono">
                    {formatCoordinate(spatialInfo.latitude!, 'lat')}, {formatCoordinate(spatialInfo.longitude!, 'lng')}
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                {spatialInfo.altitude && (
                  <div className="flex items-center gap-2">
                    <Mountain className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Altitude:</span>
                    <span className="text-sm">{spatialInfo.altitude}m above sea level</span>
                  </div>
                )}
                
                {spatialInfo.floor && (
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Floor:</span>
                    <span className="text-sm">
                      {spatialInfo.floor > 0 ? `${spatialInfo.floor}` : `B${Math.abs(spatialInfo.floor)}`}
                    </span>
                  </div>
                )}
                
                {spatialInfo.timestamp && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Time:</span>
                    <span className="text-sm">{formatTimestamp(spatialInfo.timestamp)}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Citations */}
      {citations.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <LinkIcon className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold">Citations</h3>
            </div>
            
            <div className="space-y-3">
              {citations.map((citation, index) => (
                <div key={index} className="border-l-4 border-gray-200 pl-4">
                  <div className="flex items-center gap-2 mb-1">
                    {citation.type === 'spatial' && <MapPin className="h-4 w-4 text-blue-500" />}
                    {citation.type === 'user' && <AtSign className="h-4 w-4 text-purple-500" />}
                    {citation.type === 'url' && <LinkIcon className="h-4 w-4 text-green-500" />}
                    <Badge variant="outline" className="text-xs">
                      {citation.type.charAt(0).toUpperCase() + citation.type.slice(1)}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-gray-700 mb-2">{citation.content}</p>
                  
                  {citation.type === 'user' && citation.userId && (
                    <div className="text-xs text-muted-foreground">
                      Referenced user: @{citation.userId}
                    </div>
                  )}
                  
                  {citation.type === 'url' && citation.url && (
                    <div className="text-xs">
                      <a 
                        href={citation.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1"
                      >
                        {citation.url}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hashtag */}
      {hashtag && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Hash className="h-5 w-5 text-blue-600" />
              <Badge variant="secondary" className="text-base px-3 py-1">
                {hashtag}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* URLs and QR Code */}
      {(slug || shortUrl || qrCodeUrl) && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Globe className="h-4 w-4" />
              <h3 className="font-semibold">Share Links</h3>
            </div>
            
            <div className="space-y-3">
              {slug && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Full URL</label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 text-xs bg-gray-100 p-2 rounded border font-mono">
                      {window.location.origin}/{slug}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(`${window.location.origin}/${slug}`)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
              
              {shortUrl && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Short URL</label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 text-xs bg-gray-100 p-2 rounded border font-mono">
                      {shortUrl}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(shortUrl)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
              
              {qrCodeUrl && showQrCode && (
                <div className="flex items-center gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">QR Code</label>
                    <img 
                      src={qrCodeUrl} 
                      alt="QR Code" 
                      className="mt-1 w-24 h-24 border rounded"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-2">
                      Scan this QR code to access the post with spatial information
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const link = document.createElement('a')
                        link.href = qrCodeUrl
                        link.download = 'qr-code.png'
                        link.click()
                      }}
                    >
                      <QrCode className="h-4 w-4 mr-2" />
                      Download QR Code
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
