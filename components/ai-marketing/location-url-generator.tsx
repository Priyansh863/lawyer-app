"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { MapPin, Navigation, Search, Map, Smartphone, QrCode, Copy, Info, Crosshair, Globe } from 'lucide-react'
import { useTranslation } from "@/hooks/useTranslation"

const locationSchema = z.object({
  planet: z.string().default("Earth"),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  altitude: z.number().min(-500).max(9000).optional(),
  timestamp: z.string().optional(),
  floor: z.number().optional(),
  address: z.string().optional(),
  placeName: z.string().optional(),
})

type LocationFormData = z.infer<typeof locationSchema>

interface LocationUrlGeneratorProps {
  postTitle: string
  onUrlGenerated: (urls: { full: string; short: string }) => void
  onQrGenerated: (qrUrl: string) => void
  onSpatialInfoChange: (info: LocationFormData) => void
}

export default function LocationUrlGenerator({
  postTitle,
  onUrlGenerated,
  onQrGenerated,
  onSpatialInfoChange,
}: LocationUrlGeneratorProps) {
  const { t } = useTranslation()
  const [currentAltitude, setCurrentAltitude] = useState<number | null>(null)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([])
  const [placeSuggestions, setPlaceSuggestions] = useState<any[]>([])

  const form = useForm<LocationFormData>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      planet: "Earth",
    },
  })

  const watchedValues = form.watch()

  useEffect(() => {
    if (watchedValues.latitude && watchedValues.longitude) {
      const urls = generateCustomUrl(watchedValues, postTitle)
      onUrlGenerated(urls)
      generateQRCode(urls.short)
    } else {
      onUrlGenerated({ full: "", short: "" })
      onQrGenerated("")
    }
    onSpatialInfoChange(watchedValues)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedValues, postTitle])

  const generateCustomUrl = (location: LocationFormData, title: string) => {
    const baseSlug = title.toLowerCase().replace(/\s+/g, "-")
    const baseUrl = `https://lawgg.net/${baseSlug}`

    if (!location.latitude || !location.longitude) {
      return { full: baseUrl, short: `https://lawgg.net/l/${baseSlug}` }
    }

    const params = new URLSearchParams()
    params.set("planet", location.planet || "Earth")
    params.set("lat", location.latitude.toString())
    params.set("lng", location.longitude.toString())
    if (location.altitude !== undefined) params.set("altitude", location.altitude.toString())
    if (location.timestamp) params.set("timestamp", location.timestamp)
    if (location.floor !== undefined) params.set("floor", location.floor.toString())

    const fullUrl = `${baseUrl}?${params.toString()}`

    const parts = [
      location.planet || "Earth",
      location.latitude,
      location.longitude,
      location.altitude ?? "",
      location.timestamp ?? "",
      location.floor ?? "",
    ]
    const shortUrl = `https://lawgg.net/l/${baseSlug}?${parts.join(",")}`

    return { full: fullUrl, short: shortUrl }
  }

  const generateQRCode = (url: string) => {
    if (!url) {
      onQrGenerated("")
      return
    }
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`
    onQrGenerated(qrUrl)
  }

  // Address Input
  const searchAddresses = async (query: string) => {
    if (query.length < 3) {
      setAddressSuggestions([])
      return
    }
    const mockAddresses = [
      { description: "123 Main Street, New York, NY, USA", lat: 40.7128, lng: -74.006 },
      { description: "456 Broadway, New York, NY, USA", lat: 40.7589, lng: -73.9851 },
      { description: "789 Fifth Avenue, New York, NY, USA", lat: 40.7614, lng: -73.9776 },
    ].filter((addr) => addr.description.toLowerCase().includes(query.toLowerCase()))
    setAddressSuggestions(mockAddresses)
  }

  const searchPlaces = async (query: string) => {
    if (query.length < 3) {
      setPlaceSuggestions([])
      return
    }
    const mockPlaces = [
      { name: "Central Park", lat: 40.7829, lng: -73.9654 },
      { name: "Times Square", lat: 40.758, lng: -73.9855 },
      { name: "Brooklyn Bridge", lat: 40.7061, lng: -73.9969 },
    ].filter((place) => place.name.toLowerCase().includes(query.toLowerCase()))
    setPlaceSuggestions(mockPlaces)
  }

  const handleMapClick = () => {
    const mockLat = 40.7128 + (Math.random() - 0.5) * 0.01
    const mockLng = -74.006 + (Math.random() - 0.5) * 0.01
    form.setValue("latitude", Number.parseFloat(mockLat.toFixed(6)))
    form.setValue("longitude", Number.parseFloat(mockLng.toFixed(6)))
  }

  const getCurrentLocation = () => {
    setIsGettingLocation(true)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          form.setValue("latitude", Number.parseFloat(position.coords.latitude.toFixed(6)))
          form.setValue("longitude", Number.parseFloat(position.coords.longitude.toFixed(6)))
          setCurrentAltitude(Math.round(position.coords.altitude || Math.random() * 100))
          setIsGettingLocation(false)
        },
        (error) => {
          console.error("Error getting location:", error)
          setIsGettingLocation(false)
        },
      )
    } else {
      form.setValue("latitude", 40.7128)
      form.setValue("longitude", -74.006)
      setCurrentAltitude(27)
      setIsGettingLocation(false)
    }
  }

  const selectAddress = (address: any) => {
    form.setValue("latitude", address.lat)
    form.setValue("longitude", address.lng)
    form.setValue("address", address.description)
    setAddressSuggestions([])
  }

  const selectPlace = (place: any) => {
    form.setValue("latitude", place.lat)
    form.setValue("longitude", place.lng)
    form.setValue("placeName", place.name)
    setPlaceSuggestions([])
  }

  const copyToClipboard = (text: string) => {
    if (!text) return
    navigator.clipboard.writeText(text).catch(() => {})
  }

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {t("pages:location.cardTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Form {...form}>
            <Tabs defaultValue="address" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="address" className="text-xs">
                  <Search className="h-3 w-3 mr-1" />
                  {t("pages:location.tabs.address")}
                </TabsTrigger>
                <TabsTrigger value="place" className="text-xs">
                  <MapPin className="h-3 w-3 mr-1" />
                  {t("pages:location.tabs.place")}
                </TabsTrigger>
                <TabsTrigger value="map" className="text-xs">
                  <Map className="h-3 w-3 mr-1" />
                  {t("pages:location.tabs.map")}
                </TabsTrigger>
                <TabsTrigger value="gps" className="text-xs">
                  <Smartphone className="h-3 w-3 mr-1" />
                  {t("pages:location.tabs.gps")}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="address" className="space-y-3">
                <div>
                  <Label htmlFor="address-search">{t("pages:location.addressLabel")}</Label>
                  <Input
                    id="address-search"
                    placeholder={t("pages:location.addressPlaceholder")}
                    onChange={(e) => searchAddresses(e.target.value)}
                  />
                  {addressSuggestions.length > 0 && (
                    <div className="mt-2 border rounded-md max-h-40 overflow-y-auto">
                      {addressSuggestions.map((addr, index) => (
                        <button
                          key={index}
                          type="button"
                          className="w-full text-left p-2 hover:bg-gray-100 text-sm"
                          onClick={() => selectAddress(addr)}
                        >
                          {addr.description}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="place" className="space-y-3">
                <div>
                  <Label htmlFor="place-search">{t("pages:location.placeLabel")}</Label>
                  <Input
                    id="place-search"
                    placeholder={t("pages:location.placePlaceholder")}
                    onChange={(e) => searchPlaces(e.target.value)}
                  />
                  {placeSuggestions.length > 0 && (
                    <div className="mt-2 border rounded-md max-h-40 overflow-y-auto">
                      {placeSuggestions.map((place, index) => (
                        <button
                          key={index}
                          type="button"
                          className="w-full text-left p-2 hover:bg-gray-100 text-sm"
                          onClick={() => selectPlace(place)}
                        >
                          {place.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="map" className="space-y-3">
                <div className="text-center">
                  <Button type="button" variant="outline" onClick={handleMapClick}>
                    <Crosshair className="h-4 w-4 mr-2" />
                    {t("pages:location.mapClick")}
                  </Button>
                  <p className="text-xs text-gray-500 mt-2">{t("pages:location.mapHelper")}</p>
                </div>
              </TabsContent>

              <TabsContent value="gps" className="space-y-3">
                <div className="text-center">
                  <Button type="button" variant="outline" onClick={getCurrentLocation} disabled={isGettingLocation}>
                    {isGettingLocation ? (
                      <>
                        <Navigation className="h-4 w-4 mr-2 animate-spin" />
                        {t("pages:location.gpsGetting")}
                      </>
                    ) : (
                      <>
                        <Navigation className="h-4 w-4 mr-2" />
                        {t("pages:location.gpsButton")}
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-gray-500 mt-2">{t("pages:location.gpsHelper")}</p>
                </div>
              </TabsContent>
            </Tabs>

            {/* Manual Coordinate Input */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-gray-50">
              <FormField
                control={form.control}
                name="latitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("pages:location.latLabel")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.000001"
                        placeholder={t("pages:location.latPlaceholder")}
                        {...field}
                        onChange={(e) => field.onChange(Number.isFinite(Number.parseFloat(e.target.value)) ? Number.parseFloat(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <p className="text-xs text-gray-500">{t("pages:location.latHelper")}</p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="longitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("pages:location.lngLabel")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.000001"
                        placeholder={t("pages:location.lngPlaceholder")}
                        {...field}
                        onChange={(e) => field.onChange(Number.isFinite(Number.parseFloat(e.target.value)) ? Number.parseFloat(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <p className="text-xs text-gray-500">{t("pages:location.lngHelper")}</p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {watchedValues.latitude && watchedValues.longitude && (
                <>
                  <FormField
                    control={form.control}
                    name="altitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          {t("pages:location.altLabel")}
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="h-3 w-3" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{t("pages:location.altHelper")}</p>
                            </TooltipContent>
                          </Tooltip>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder={t("pages:location.altPlaceholder")}
                            {...field}
                            onChange={(e) => field.onChange(Number.isFinite(Number.parseFloat(e.target.value)) ? Number.parseFloat(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>{t("pages:location.altRange")}</span>
                          {currentAltitude !== null && (
                            <Tooltip>
                              <TooltipTrigger>
                                <Badge variant="outline" className="text-xs">
                                  {t("pages:location.altCurrent", { value: currentAltitude })}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{t("pages:location.altCurrentHelper")}</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="floor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          {t("pages:location.floorLabel")}
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="h-3 w-3" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{t("pages:location.floorHelper")}</p>
                            </TooltipContent>
                          </Tooltip>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder={t("pages:location.floorPlaceholder")}
                            {...field}
                            onChange={(e) => field.onChange(Number.isFinite(Number.parseInt(e.target.value)) ? Number.parseInt(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="timestamp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("pages:location.timeLabel")}</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <p className="text-xs text-gray-500">{t("pages:location.timeHelper")}</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="planet"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("pages:location.planetLabel")}</FormLabel>
                        <FormControl>
                          <Input placeholder={t("pages:location.planetPlaceholder")} {...field} />
                        </FormControl>
                        <p className="text-xs text-gray-500">{t("pages:location.planetHelper")}</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </div>

            {/* Generated URLs Display */}
            {watchedValues.latitude && watchedValues.longitude && (
              <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900">{t("pages:location.generatedUrls")}</h4>
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-blue-800">{t("pages:location.fullUrlLabel")}</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="flex-1 p-2 bg-white rounded text-xs break-all">
                        {generateCustomUrl(watchedValues, postTitle).full}
                      </code>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(generateCustomUrl(watchedValues, postTitle).full)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-blue-800">{t("pages:location.shortUrlLabel")}</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="flex-1 p-2 bg-white rounded text-xs break-all">
                        {generateCustomUrl(watchedValues, postTitle).short}
                      </code>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(generateCustomUrl(watchedValues, postTitle).short)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => generateQRCode(generateCustomUrl(watchedValues, postTitle).short)}
                    >
                      <QrCode className="h-4 w-4 mr-2" />
                      {t("pages:location.qrButton")}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Form>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
