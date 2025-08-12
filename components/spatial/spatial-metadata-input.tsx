"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  MapPin,
  Navigation,
  Mountain,
  Clock,
  Building,
  Hash,
  AtSign,
  Link,
  QrCode,
  Info,
  Target,
  Globe,
  Loader2
} from 'lucide-react'

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

interface SpatialMetadataInputProps {
  spatialInfo?: SpatialInfo
  citations?: Citation[]
  hashtag?: string
  onSpatialInfoChange: (spatialInfo: SpatialInfo) => void
  onCitationsChange: (citations: any) => void
  onHashtagChange: (hashtag: string) => void
  generateCustomUrl: (spatialInfo: SpatialInfo) => string
  generateShortUrl: (spatialInfo: SpatialInfo) => string
  generateQrCode: (url: string) => Promise<string>
}

export default function SpatialMetadataInput({
  spatialInfo = {},
  citations = [],
  hashtag = '',
  onSpatialInfoChange,
  onCitationsChange,
  onHashtagChange,
  generateCustomUrl,
  generateShortUrl,
  generateQrCode
}: SpatialMetadataInputProps) {
  const [currentAltitude, setCurrentAltitude] = useState<number | null>(null)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [isGeneratingQr, setIsGeneratingQr] = useState(false)

  // Get current location
  const getCurrentLocation = async () => {
    setIsGettingLocation(true)
    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by this browser')
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        })
      })

      const newSpatialInfo = {
        ...spatialInfo,
        planet: 'Earth',
        latitude: parseFloat(position.coords.latitude.toFixed(6)),
        longitude: parseFloat(position.coords.longitude.toFixed(6))
      }

      if (position.coords.altitude) {
        setCurrentAltitude(Math.round(position.coords.altitude))
      }

      onSpatialInfoChange(newSpatialInfo)
    } catch (error) {
      console.error('Error getting location:', error)
      alert('Unable to get your location. Please enter coordinates manually.')
    } finally {
      setIsGettingLocation(false)
    }
  }

  // Handle spatial info changes
  const handleSpatialChange = (field: keyof SpatialInfo, value: any) => {
    const newSpatialInfo = { ...spatialInfo, [field]: value }
    onSpatialInfoChange(newSpatialInfo)
  }

  // Add citation
  const addCitation = (type: Citation['type']) => {
    const newCitation: Citation = {
      type,
      content: '',
      ...(type === 'spatial' && { spatialInfo: {} }),
      ...(type === 'user' && { userId: '' }),
      ...(type === 'url' && { url: '' })
    }
    onCitationsChange([...citations, newCitation])
  }

  // Update citation
  const updateCitation = (index: number, updates: Partial<Citation>) => {
    const newCitations = [...citations]
    newCitations[index] = { ...newCitations[index], ...updates }
    onCitationsChange(newCitations)
  }

  // Remove citation
  const removeCitation = (index: number) => {
    const newCitations = citations.filter((_, i) => i !== index)
    onCitationsChange(newCitations)
  }

  // Generate QR code
  const handleGenerateQrCode = async () => {
    setIsGeneratingQr(true)
    try {
      const customUrl = generateCustomUrl(spatialInfo)
      const qrUrl = await generateQrCode(customUrl)
      setQrCodeUrl(qrUrl)
    } catch (error) {
      console.error('Error generating QR code:', error)
      alert('Failed to generate QR code')
    } finally {
      setIsGeneratingQr(false)
    }
  }

  const hasLocation = spatialInfo.latitude && spatialInfo.longitude

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Spatial Information Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Spatial Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Location Input Methods */}
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={getCurrentLocation}
                disabled={isGettingLocation}
                className="flex items-center gap-2"
              >
                {isGettingLocation ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Target className="h-4 w-4" />
                )}
                Get Current Location
              </Button>
              
              {currentAltitude && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Mountain className="h-3 w-3" />
                  Current Altitude: {currentAltitude}m
                </Badge>
              )}
            </div>

            {/* Coordinate Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="0.000001"
                  min="-90"
                  max="90"
                  value={spatialInfo.latitude || ''}
                  onChange={(e) => handleSpatialChange('latitude', e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="37.566123"
                />
              </div>
              <div>
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="0.000001"
                  min="-180"
                  max="180"
                  value={spatialInfo.longitude || ''}
                  onChange={(e) => handleSpatialChange('longitude', e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="126.978456"
                />
              </div>
            </div>

            {/* Advanced Fields (only show if location is provided) */}
            {hasLocation && (
              <>
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="altitude" className="flex items-center gap-2">
                      Altitude (m)
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Enter the altitude above sea level in meters (e.g., 27.5m)</p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <Input
                      id="altitude"
                      type="number"
                      step="0.1"
                      min="-500"
                      max="9000"
                      value={spatialInfo.altitude || ''}
                      onChange={(e) => handleSpatialChange('altitude', e.target.value ? parseFloat(e.target.value) : undefined)}
                      placeholder="27.5"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="floor" className="flex items-center gap-2">
                      Floor
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Enter the building floor as a number. Use negative numbers for basement floors (e.g., 5 → '5', Basement 1 → '-1')</p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <Input
                      id="floor"
                      type="number"
                      value={spatialInfo.floor || ''}
                      onChange={(e) => handleSpatialChange('floor', e.target.value ? parseInt(e.target.value) : undefined)}
                      placeholder="5 or -1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="timestamp">Specific Time</Label>
                    <Input
                      id="timestamp"
                      type="datetime-local"
                      value={spatialInfo.timestamp || ''}
                      onChange={(e) => handleSpatialChange('timestamp', e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Citations Section */}
        <Card>
          <CardHeader>
            <CardTitle>Citations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {citations.map((citation, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">
                    {citation.type === 'spatial' && <MapPin className="h-3 w-3 mr-1" />}
                    {citation.type === 'user' && <AtSign className="h-3 w-3 mr-1" />}
                    {citation.type === 'url' && <Link className="h-3 w-3 mr-1" />}
                    {citation.type.charAt(0).toUpperCase() + citation.type.slice(1)} Citation
                  </Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCitation(index)}
                  >
                    Remove
                  </Button>
                </div>
                
                <Textarea
                  placeholder="Citation content..."
                  value={citation.content}
                  onChange={(e) => updateCitation(index, { content: e.target.value })}
                  maxLength={500}
                />
                
                {citation.type === 'user' && (
                  <Input
                    placeholder="@username"
                    value={citation.userId || ''}
                    onChange={(e) => updateCitation(index, { userId: e.target.value })}
                  />
                )}
                
                {citation.type === 'url' && (
                  <Input
                    placeholder="https://example.com"
                    value={citation.url || ''}
                    onChange={(e) => updateCitation(index, { url: e.target.value })}
                  />
                )}
              </div>
            ))}
            
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addCitation('spatial')}
              >
                <MapPin className="h-4 w-4 mr-2" />
                Add Spatial Citation
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addCitation('user')}
              >
                <AtSign className="h-4 w-4 mr-2" />
                Add User Citation
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addCitation('url')}
              >
                <Link className="h-4 w-4 mr-2" />
                Add URL Citation
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Hashtag Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hash className="h-5 w-5" />
              Hashtag
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="#hashtag"
              value={hashtag}
              onChange={(e) => onHashtagChange(e.target.value)}
              maxLength={50}
            />
            <p className="text-sm text-muted-foreground mt-1">
              One hashtag allowed per post/blog
            </p>
          </CardContent>
        </Card>

        {/* URL Preview & QR Code */}
        {hasLocation && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                URL Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Full URL</Label>
                <Input
                  value={generateCustomUrl(spatialInfo)}
                  readOnly
                  className="font-mono text-sm"
                />
              </div>
              
              <div>
                <Label>Short URL</Label>
                <Input
                  value={generateShortUrl(spatialInfo)}
                  readOnly
                  className="font-mono text-sm"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGenerateQrCode}
                  disabled={isGeneratingQr}
                  className="flex items-center gap-2"
                >
                  {isGeneratingQr ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <QrCode className="h-4 w-4" />
                  )}
                  Generate QR Code
                </Button>
                
                {qrCodeUrl && (
                  <div className="ml-4">
                    <img src={qrCodeUrl} alt="QR Code" className="w-16 h-16" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  )
}
