'use client'

import React, { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MapPin, Navigation, Info, Mountain, Building, Clock, Globe } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { SpatialInfo, validateSpatialInfo } from '@/lib/api/post-api'
import { useToast } from '@/hooks/use-toast'

interface LocationInputProps {
  spatialInfo?: SpatialInfo
  onSpatialInfoChange: (spatialInfo: SpatialInfo | undefined) => void
  className?: string
}

export const LocationInput: React.FC<LocationInputProps> = ({
  spatialInfo,
  onSpatialInfoChange,
  className = ''
}) => {
  const { toast } = useToast()
  const [isGettingLocation, setIsGettingLocation] = useState(false)

  // Handle coordinate input
  const handleCoordinateChange = useCallback((field: keyof SpatialInfo, value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value)
    
    const newSpatialInfo = {
      ...spatialInfo,
      [field]: numValue
    }

    // Remove undefined values to keep the object clean
    Object.keys(newSpatialInfo).forEach(key => {
      if (newSpatialInfo[key as keyof SpatialInfo] === undefined) {
        delete newSpatialInfo[key as keyof SpatialInfo]
      }
    })

    onSpatialInfoChange(Object.keys(newSpatialInfo).length > 0 ? newSpatialInfo : undefined)
  }, [spatialInfo, onSpatialInfoChange])

  // Handle text field changes
  const handleTextChange = useCallback((field: keyof SpatialInfo, value: string) => {
    const newSpatialInfo = {
      ...spatialInfo,
      [field]: value || undefined
    }

    // Remove undefined values
    Object.keys(newSpatialInfo).forEach(key => {
      if (newSpatialInfo[key as keyof SpatialInfo] === undefined) {
        delete newSpatialInfo[key as keyof SpatialInfo]
      }
    })

    onSpatialInfoChange(Object.keys(newSpatialInfo).length > 0 ? newSpatialInfo : undefined)
  }, [spatialInfo, onSpatialInfoChange])

  // Get current location using browser geolocation
  const getCurrentLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation not supported",
        description: "Your browser doesn't support geolocation",
        variant: "destructive"
      })
      return
    }

    setIsGettingLocation(true)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, altitude } = position.coords
        
        const newSpatialInfo: SpatialInfo = {
          ...spatialInfo,
          planet: 'Earth',
          latitude: parseFloat(latitude.toFixed(6)),
          longitude: parseFloat(longitude.toFixed(6)),
          altitude: altitude ? parseFloat(altitude.toFixed(1)) : undefined
        }

        onSpatialInfoChange(newSpatialInfo)
        setIsGettingLocation(false)
        
        toast({
          title: "Location obtained",
          description: `Coordinates: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
        })
      },
      (error) => {
        setIsGettingLocation(false)
        let message = "Failed to get location"
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = "Location access denied by user"
            break
          case error.POSITION_UNAVAILABLE:
            message = "Location information unavailable"
            break
          case error.TIMEOUT:
            message = "Location request timed out"
            break
        }

        toast({
          title: "Location Error",
          description: message,
          variant: "destructive"
        })
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  }, [spatialInfo, onSpatialInfoChange, toast])

  // Clear all location data
  const clearLocation = useCallback(() => {
    onSpatialInfoChange(undefined)
  }, [onSpatialInfoChange])

  // Validate current spatial info
  const validationErrors = spatialInfo ? validateSpatialInfo(spatialInfo) : []

  return (
    <TooltipProvider>
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="h-5 w-5" />
            Add Location Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs defaultValue="auto" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="auto">Auto-Locate</TabsTrigger>
              <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            </TabsList>

            {/* Auto-Locate Tab */}
            <TabsContent value="auto" className="space-y-4">
              <div className="text-center space-y-4">
                <Button
                  onClick={getCurrentLocation}
                  disabled={isGettingLocation}
                  className="w-full"
                  size="lg"
                >
                  <Navigation className="h-4 w-4 mr-2" />
                  {isGettingLocation ? 'Getting Location...' : 'Use Current Location'}
                </Button>
                <p className="text-sm text-gray-500">
                  Get your current location using GPS for precise coordinates
                </p>
              </div>
            </TabsContent>

            {/* Manual Entry Tab */}
            <TabsContent value="manual" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="0.000001"
                    min="-90"
                    max="90"
                    placeholder="37.556074"
                    value={spatialInfo?.latitude || ''}
                    onChange={(e) => handleCoordinateChange('latitude', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="0.000001"
                    min="-180"
                    max="180"
                    placeholder="126.9718732"
                    value={spatialInfo?.longitude || ''}
                    onChange={(e) => handleCoordinateChange('longitude', e.target.value)}
                  />
                </div>
              </div>
              <p className="text-sm text-gray-500">
                Enter coordinates manually (latitude: -90 to 90, longitude: -180 to 180)
              </p>
            </TabsContent>
          </Tabs>

          {/* Additional Fields (only show if coordinates are provided) */}
          {spatialInfo?.latitude && spatialInfo?.longitude && (
            <div className="border-t pt-4 space-y-4">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Info className="h-4 w-4" />
                Additional Details (Optional)
              </h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="altitude">Altitude (meters)</Label>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Enter the altitude above sea level in meters (e.g., 27.5m)</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    id="altitude"
                    type="number"
                    step="0.1"
                    min="-500"
                    max="9000"
                    placeholder="27.5"
                    value={spatialInfo?.altitude || ''}
                    onChange={(e) => handleCoordinateChange('altitude', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="floor">Floor</Label>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Enter the building floor as a number. Use negative numbers for basement floors (e.g., 5 → '5', Basement 1 → '-1')</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    id="floor"
                    type="number"
                    placeholder="5 or -1"
                    value={spatialInfo?.floor || ''}
                    onChange={(e) => handleCoordinateChange('floor', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="timestamp">Timestamp</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Enter a specific time for this location (optional)</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="timestamp"
                  type="datetime-local"
                  value={spatialInfo?.timestamp?.slice(0, 16) || ''}
                  onChange={(e) => handleTextChange('timestamp', e.target.value ? `${e.target.value}:00` : '')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="planet">Planet</Label>
                <Input
                  id="planet"
                  placeholder="Earth"
                  value={spatialInfo?.planet || 'Earth'}
                  onChange={(e) => handleTextChange('planet', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <h4 className="text-sm font-medium text-red-800 mb-2">Validation Errors:</h4>
              <ul className="text-sm text-red-700 space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Current Location Status */}
          <div className="flex justify-between items-center pt-4 border-t">
            <Button variant="outline" onClick={clearLocation}>
              Clear Location
            </Button>
            {spatialInfo?.latitude && spatialInfo?.longitude && (
              <div className="text-sm text-green-600 flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                Location Set ({spatialInfo.latitude.toFixed(4)}, {spatialInfo.longitude.toFixed(4)})
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}

export default LocationInput
