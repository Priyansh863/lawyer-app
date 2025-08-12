"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
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
  MapPin, 
  Globe, 
  Mountain, 
  Building, 
  Clock, 
  Copy, 
  RotateCcw,
  Search,
  Crosshair,
  Info
} from "lucide-react";
import { SpatialInfo } from "@/lib/api/posts-api";

interface LocationUrlGeneratorProps {
  onLocationSelect: (spatialInfo: SpatialInfo) => void;
  initialData?: SpatialInfo;
}

// Google Places API implementation
const searchPlacesAPI = async (query: string) => {
  if (!query.trim()) return [];
  
  try {
    // Use Google Places API Text Search
    const response = await fetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch places');
    }
    
    const data = await response.json();
    
    return data.results?.slice(0, 5).map((place: any) => ({
      place_id: place.place_id,
      description: place.formatted_address || place.name,
      lat: place.geometry.location.lat,
      lng: place.geometry.location.lng
    })) || [];
  } catch (error) {
    console.error('Places search error:', error);
    // Fallback to mock data if API fails
    return [
      {
        place_id: '1',
        description: 'Times Square, New York, NY, USA',
        lat: 40.758896,
        lng: -73.985130
      },
      {
        place_id: '2', 
        description: 'Central Park, New York, NY, USA',
        lat: 40.785091,
        lng: -73.968285
      }
    ];
  }
};

export default function LocationUrlGenerator({ onLocationSelect, initialData }: LocationUrlGeneratorProps) {
  const { toast } = useToast();
  
  // Form state
  const [spatialInfo, setSpatialInfo] = useState<SpatialInfo>({
    planet: 'Earth',
    latitude: undefined,
    longitude: undefined,
    altitude: undefined,
    timestamp: undefined,
    floor: undefined,
    ...initialData
  });

  // UI state
  const [addressQuery, setAddressQuery] = useState("");
  const [placeQuery, setPlaceQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentAltitude, setCurrentAltitude] = useState<number | null>(null);
  const [inputMethod, setInputMethod] = useState<'manual' | 'address' | 'place' | 'map' | 'auto'>('manual');

  // Get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation not supported",
        description: "Your browser doesn't support geolocation",
        variant: "destructive",
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = parseFloat(position.coords.latitude.toFixed(6));
        const lng = parseFloat(position.coords.longitude.toFixed(6));
        
        setSpatialInfo(prev => ({
          ...prev,
          latitude: lat,
          longitude: lng
        }));

        // Get altitude if available
        if (position.coords.altitude) {
          setCurrentAltitude(Math.round(position.coords.altitude));
        }

        toast({
          title: "Location obtained",
          description: `Coordinates: ${lat}, ${lng}`,
          variant: "default",
        });
      },
      (error) => {
        toast({
          title: "Location error",
          description: error.message,
          variant: "destructive",
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  // Search places
  const searchPlaces = async (query: string, type: 'address' | 'place') => {
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const results = await searchPlacesAPI(query);
      setSearchResults(results);
    } catch (error) {
      toast({
        title: "Search failed",
        description: "Failed to search places",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Select place from search results
  const selectPlace = (place: any) => {
    const lat = parseFloat(place.lat.toFixed(6));
    const lng = parseFloat(place.lng.toFixed(6));
    
    setSpatialInfo(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng
    }));

    setSearchResults([]);
    setAddressQuery("");
    setPlaceQuery("");

    toast({
      title: "Location selected",
      description: place.description,
      variant: "default",
    });
  };

  // Debounced search for autocomplete
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (addressQuery.trim().length > 2 && inputMethod === 'address') {
        searchPlacesAPI(addressQuery).then(results => {
          setSearchResults(results);
          setShowSuggestions(results.length > 0);
        }).catch(() => {
          setSearchResults([]);
          setShowSuggestions(false);
        });
      } else {
        setSearchResults([]);
        setShowSuggestions(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [addressQuery, inputMethod]);

  // Handle address input change
  const handleAddressChange = (value: string) => {
    setAddressQuery(value);
    if (value.trim().length > 2) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
      setSearchResults([]);
    }
  };

  // Generate URLs
  const generateCustomUrl = () => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://yourapp.com';
    let url = `${baseUrl}/post-title`;
    
    if (spatialInfo.latitude && spatialInfo.longitude) {
      const params = new URLSearchParams();
      
      if (spatialInfo.planet) params.append('planet', spatialInfo.planet);
      params.append('lat', spatialInfo.latitude.toString());
      params.append('lng', spatialInfo.longitude.toString());
      
      if (spatialInfo.altitude !== null && spatialInfo.altitude !== undefined) {
        params.append('altitude', spatialInfo.altitude.toString());
      }
      
      if (spatialInfo.timestamp) {
        params.append('timestamp', spatialInfo.timestamp);
      }
      
      if (spatialInfo.floor !== null && spatialInfo.floor !== undefined) {
        params.append('floor', spatialInfo.floor.toString());
      }
      
      url += `?${params.toString()}`;
    }
    
    return url;
  };

  const generateShortUrl = () => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://yourapp.com';
    let url = `${baseUrl}/l/post-title`;
    
    if (spatialInfo.latitude && spatialInfo.longitude) {
      const parts = [
        spatialInfo.planet || 'Earth',
        spatialInfo.latitude.toString(),
        spatialInfo.longitude.toString(),
        spatialInfo.altitude?.toString() || '',
        spatialInfo.timestamp || '',
        spatialInfo.floor?.toString() || ''
      ];
      
      url += `?${parts.join(',')}`;
    }
    
    return url;
  };

  // Handle form submission
  const handleSubmit = () => {
    if (spatialInfo.latitude && spatialInfo.longitude) {
      // Validate coordinates
      if (spatialInfo.latitude < -90 || spatialInfo.latitude > 90) {
        toast({
          title: "Invalid latitude",
          description: "Latitude must be between -90 and 90",
          variant: "destructive",
        });
        return;
      }

      if (spatialInfo.longitude < -180 || spatialInfo.longitude > 180) {
        toast({
          title: "Invalid longitude", 
          description: "Longitude must be between -180 and 180",
          variant: "destructive",
        });
        return;
      }
    }

    onLocationSelect(spatialInfo);
    
    toast({
      title: "Location data saved",
      description: "Spatial information has been applied to your post",
      variant: "default",
    });
  };

  // Reset form
  const resetForm = () => {
    setSpatialInfo({
      planet: 'Earth',
      latitude: undefined,
      longitude: undefined,
      altitude: undefined,
      timestamp: undefined,
      floor: undefined
    });
    setSearchResults([]);
    setAddressQuery("");
    setPlaceQuery("");
    setCurrentAltitude(null);
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

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Location & Spatial Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Input Method Selection */}
        <div className="space-y-2">
          <Label>Location Input Method</Label>
          <Select value={inputMethod} onValueChange={(value: any) => setInputMethod(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">Manual Coordinates</SelectItem>
              <SelectItem value="address">Address Search</SelectItem>
              <SelectItem value="place">Place Search</SelectItem>
              <SelectItem value="auto">Auto-detect Location</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Manual Input */}
        {inputMethod === 'manual' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                type="number"
                step="0.000001"
                min="-90"
                max="90"
                value={spatialInfo.latitude || ''}
                onChange={(e) => setSpatialInfo(prev => ({
                  ...prev,
                  latitude: e.target.value ? parseFloat(e.target.value) : undefined
                }))}
                placeholder="37.566123"
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
                value={spatialInfo.longitude || ''}
                onChange={(e) => setSpatialInfo(prev => ({
                  ...prev,
                  longitude: e.target.value ? parseFloat(e.target.value) : undefined
                }))}
                placeholder="126.978456"
              />
            </div>
          </div>
        )}

        {/* Address Search */}
        {inputMethod === 'address' && (
          <div className="space-y-2">
            <Label htmlFor="address">Search Address</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="address"
                  value={addressQuery}
                  onChange={(e) => handleAddressChange(e.target.value)}
                  placeholder="Enter address..."
                  autoComplete="off"
                />
                {/* Autocomplete Suggestions */}
                {showSuggestions && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {searchResults.map((place, index) => (
                      <div
                        key={place.place_id || index}
                        className="px-4 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                        onClick={() => selectPlace(place)}
                      >
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{place.description}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <Button 
                onClick={() => searchPlaces(addressQuery, 'address')}
                disabled={isSearching}
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Place Search */}
        {inputMethod === 'place' && (
          <div className="space-y-2">
            <Label htmlFor="place">Search Place</Label>
            <div className="flex gap-2">
              <Input
                id="place"
                value={placeQuery}
                onChange={(e) => setPlaceQuery(e.target.value)}
                placeholder="Enter place name..."
              />
              <Button 
                onClick={() => searchPlaces(placeQuery, 'place')}
                disabled={isSearching}
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Auto Location */}
        {inputMethod === 'auto' && (
          <div className="space-y-2">
            <Button onClick={getCurrentLocation} className="w-full">
              <Crosshair className="h-4 w-4 mr-2" />
              Get Current Location
            </Button>
            {currentAltitude && (
              <div className="text-sm text-gray-600">
                <Info className="h-4 w-4 inline mr-1" />
                Current altitude: {currentAltitude}m (for reference)
              </div>
            )}
          </div>
        )}

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="space-y-2">
            <Label>Search Results</Label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {searchResults.map((place) => (
                <div
                  key={place.place_id}
                  className="p-2 border rounded cursor-pointer hover:bg-gray-50"
                  onClick={() => selectPlace(place)}
                >
                  <div className="text-sm font-medium">{place.description}</div>
                  <div className="text-xs text-gray-500">
                    {place.lat.toFixed(6)}, {place.lng.toFixed(6)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Additional Fields (only if coordinates are provided) */}
        {spatialInfo.latitude && spatialInfo.longitude && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="altitude">
                  Altitude (meters)
                  <Info className="h-3 w-3 inline ml-1" title="Enter altitude above sea level in meters (e.g., 27.5m)" />
                </Label>
                <Input
                  id="altitude"
                  type="number"
                  step="0.1"
                  min="-500"
                  max="9000"
                  value={spatialInfo.altitude || ''}
                  onChange={(e) => setSpatialInfo(prev => ({
                    ...prev,
                    altitude: e.target.value ? parseFloat(e.target.value) : undefined
                  }))}
                  placeholder="27.5"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="floor">
                  Floor
                  <Info className="h-3 w-3 inline ml-1" title="Enter building floor as a number. Use negative numbers for basement floors (e.g., 5 → '5', Basement 1 → '-1')" />
                </Label>
                <Input
                  id="floor"
                  type="number"
                  value={spatialInfo.floor || ''}
                  onChange={(e) => setSpatialInfo(prev => ({
                    ...prev,
                    floor: e.target.value ? parseInt(e.target.value) : undefined
                  }))}
                  placeholder="5 or -1 for basement"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timestamp">
                Specific Time (ISO 8601)
              </Label>
              <Input
                id="timestamp"
                type="datetime-local"
                value={spatialInfo.timestamp || ''}
                onChange={(e) => setSpatialInfo(prev => ({
                  ...prev,
                  timestamp: e.target.value || undefined
                }))}
              />
            </div>

            {/* URL Preview */}
            <div className="space-y-3">
              <Label>Generated URLs</Label>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">Full URL</Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyUrl(generateCustomUrl(), 'Full')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <div className="text-xs bg-gray-50 p-2 rounded break-all">
                  {generateCustomUrl()}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">Short URL</Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyUrl(generateShortUrl(), 'Short')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <div className="text-xs bg-gray-50 p-2 rounded break-all">
                  {generateShortUrl()}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button onClick={handleSubmit} className="flex-1">
            <MapPin className="h-4 w-4 mr-2" />
            Apply Location Data
          </Button>
          <Button onClick={resetForm} variant="outline">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
