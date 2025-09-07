"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { QrCode, Download, Share2, Copy, ExternalLink } from 'lucide-react'
import { Post } from '@/lib/api/posts-api'
import QRCode from 'qrcode'
import { useTranslation } from '@/hooks/useTranslation'

interface QrCodeGeneratorProps {
  post: Post
  trigger?: React.ReactNode
}

export default function QrCodeGenerator({ post, trigger }: QrCodeGeneratorProps) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [qrCodeData, setQrCodeData] = useState<string | null>(post.qrCodeUrl || null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  const handleGenerateQrCode = async () => {
    try {
      setIsGenerating(true)
      // Always use slug-based URL instead of stored customUrl to ensure current format
      let postUrl = `${window.location.origin}/${post.slug}`
      
      // Add spatial parameters if available
      if (post.spatialInfo && post.spatialInfo.latitude && post.spatialInfo.longitude) {
        const params = new URLSearchParams()
        
        if (post.spatialInfo.planet) params.append('planet', post.spatialInfo.planet)
        params.append('lat', post.spatialInfo.latitude.toString())
        params.append('lng', post.spatialInfo.longitude.toString())
        
        if (post.spatialInfo.altitude !== null && post.spatialInfo.altitude !== undefined) {
          params.append('altitude', post.spatialInfo.altitude.toString())
        }
        
        if (post.spatialInfo.timestamp) {
          params.append('timestamp', new Date(post.spatialInfo.timestamp).toISOString().slice(0, 16))
        }
        
        if (post.spatialInfo.floor !== null && post.spatialInfo.floor !== undefined) {
          params.append('floor', post.spatialInfo.floor.toString())
        }
        
        postUrl += `?${params.toString()}`
      }
      
      const qrCodeDataUrl = await QRCode.toDataURL(postUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
      
      setQrCodeData(qrCodeDataUrl)
      toast.success(t('pages:qrCode.generated.title'), {
        description: t('pages:qrCode.generated.description')
      })
    } catch (error: any) {
      console.error(t('pages:qrCode.errors.generation'), error)
      toast.error(t('pages:qrCode.errors.generationTitle'), {
        description: t('pages:qrCode.errors.generationDescription')
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownloadQrCode = async () => {
    if (!qrCodeData) return

    try {
      setIsDownloading(true)
      
      const link = document.createElement('a')
      link.href = qrCodeData
      link.download = `${post.slug}-qr-code.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success(t('pages:qrCode.download.started'), {
        description: t('pages:qrCode.download.description')
      })
    } catch (error) {
      console.error(t('pages:qrCode.errors.download'), error)
      toast.error(t('pages:qrCode.errors.downloadTitle'), {
        description: t('pages:qrCode.errors.downloadDescription')
      })
    } finally {
      setIsDownloading(false)
    }
  }

  const handleCopyPostUrl = async () => {
    // Always use slug-based URL with spatial parameters
    let postUrl = `${window.location.origin}/${post.slug}`
    
    // Add spatial parameters if available
    if (post.spatialInfo && post.spatialInfo.latitude && post.spatialInfo.longitude) {
      const params = new URLSearchParams()
      
      if (post.spatialInfo.planet) params.append('planet', post.spatialInfo.planet)
      params.append('lat', post.spatialInfo.latitude.toString())
      params.append('lng', post.spatialInfo.longitude.toString())
      
      if (post.spatialInfo.altitude !== null && post.spatialInfo.altitude !== undefined) {
        params.append('altitude', post.spatialInfo.altitude.toString())
      }
      
      if (post.spatialInfo.timestamp) {
        params.append('timestamp', new Date(post.spatialInfo.timestamp).toISOString().slice(0, 16))
      }
      
      if (post.spatialInfo.floor !== null && post.spatialInfo.floor !== undefined) {
        params.append('floor', post.spatialInfo.floor.toString())
      }
      
      postUrl += `?${params.toString()}`
    }
    
    try {
      await navigator.clipboard.writeText(postUrl)
      toast.success(t('pages:qrCode.copied.title'), {
        description: t('pages:qrCode.copied.description')
      })
    } catch (error) {
      console.error(t('pages:qrCode.errors.copy'), error)
      toast.error(t('pages:qrCode.errors.copyTitle'), {
        description: t('pages:qrCode.errors.copyDescription')
      })
    }
  }

  const handleSharePost = async () => {
    // Always use slug-based URL with spatial parameters
    let postUrl = `${window.location.origin}/${post.slug}`
    
    // Add spatial parameters if available
    if (post.spatialInfo && post.spatialInfo.latitude && post.spatialInfo.longitude) {
      const params = new URLSearchParams()
      
      if (post.spatialInfo.planet) params.append('planet', post.spatialInfo.planet)
      params.append('lat', post.spatialInfo.latitude.toString())
      params.append('lng', post.spatialInfo.longitude.toString())
      
      if (post.spatialInfo.altitude !== null && post.spatialInfo.altitude !== undefined) {
        params.append('altitude', post.spatialInfo.altitude.toString())
      }
      
      if (post.spatialInfo.timestamp) {
        params.append('timestamp', new Date(post.spatialInfo.timestamp).toISOString().slice(0, 16))
      }
      
      if (post.spatialInfo.floor !== null && post.spatialInfo.floor !== undefined) {
        params.append('floor', post.spatialInfo.floor.toString())
      }
      
      postUrl += `?${params.toString()}`
    }
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.content.substring(0, 100) + '...',
          url: postUrl,
        })
      } catch (error) {
        console.error(t('pages:qrCode.errors.share'), error)
      }
    } else {
      handleCopyPostUrl()
    }
  }

  // Generate current slug-based URL with spatial parameters
  let postUrl = `${window.location.origin}/${post.slug}`
  
  if (post.spatialInfo && post.spatialInfo.latitude && post.spatialInfo.longitude) {
    const params = new URLSearchParams()
    
    if (post.spatialInfo.planet) params.append('planet', post.spatialInfo.planet)
    params.append('lat', post.spatialInfo.latitude.toString())
    params.append('lng', post.spatialInfo.longitude.toString())
    
    if (post.spatialInfo.altitude !== null && post.spatialInfo.altitude !== undefined) {
      params.append('altitude', post.spatialInfo.altitude.toString())
    }
    
    if (post.spatialInfo.timestamp) {
      params.append('timestamp', new Date(post.spatialInfo.timestamp).toISOString().slice(0, 16))
    }
    
    if (post.spatialInfo.floor !== null && post.spatialInfo.floor !== undefined) {
      params.append('floor', post.spatialInfo.floor.toString())
    }
    
    postUrl += `?${params.toString()}`
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <QrCode className="h-4 w-4" />
            <span className="hidden sm:inline">{t('pages:qrCode.button')}</span>
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-lg w-[95vw] max-w-[95vw] sm:w-full max-h-[95vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="space-y-2 pb-4">
          <DialogTitle className="flex items-start gap-2 text-left">
            <QrCode className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <span className="text-sm sm:text-base leading-tight break-words">
              {t('pages:qrCode.dialogTitle', { title: post.title })}
            </span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Post Info */}
          <Card className="border-border">
            <CardContent className="p-4">
              <h3 className="font-medium text-sm sm:text-base mb-2 line-clamp-2 break-words">
                {post.title}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-3 line-clamp-3 break-words">
                {post.content.substring(0, 150)}...
              </p>
              <div className="flex items-start gap-2 text-xs sm:text-sm text-primary">
                <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 mt-0.5" />
                <span className="break-all text-xs">{postUrl}</span>
              </div>
            </CardContent>
          </Card>

          {/* QR Code Display */}
          <Card className="border-border">
            <CardContent className="p-4">
              {qrCodeData ? (
                <div className="text-center space-y-4">
                  <div className="bg-white p-3 sm:p-4 rounded-lg border border-border inline-block w-full max-w-[280px] mx-auto">
                    <img 
                      src={qrCodeData} 
                      alt={t('pages:qrCode.altText')} 
                      className="w-full h-auto max-w-full mx-auto"
                      style={{ imageRendering: 'crisp-edges' }}
                    />
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground px-2">
                    {t('pages:qrCode.scanInstructions')}
                  </p>
                </div>
              ) : (
                <div className="text-center py-6 sm:py-8">
                  <QrCode className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-sm sm:text-base text-muted-foreground mb-6 px-2">
                    {t('pages:qrCode.generatePrompt')}
                  </p>
                  <Button 
                    onClick={handleGenerateQrCode}
                    disabled={isGenerating}
                    className="w-full max-w-xs gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                        <span className="text-sm">{t('pages:qrCode.generating')}</span>
                      </>
                    ) : (
                      <>
                        <QrCode className="h-4 w-4" />
                        <span className="text-sm">{t('pages:qrCode.generateButton')}</span>
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          {qrCodeData && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3">
                <Button 
                  onClick={handleDownloadQrCode}
                  disabled={isDownloading}
                  className="w-full gap-2 h-11"
                >
                  {isDownloading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                      <span className="text-sm">{t('pages:qrCode.downloading')}</span>
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      <span className="text-sm">{t('pages:qrCode.downloadButton')}</span>
                    </>
                  )}
                </Button>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button 
                    variant="outline" 
                    onClick={handleCopyPostUrl}
                    className="gap-2 h-11"
                  >
                    <Copy className="h-4 w-4" />
                    <span className="text-sm">{t('pages:qrCode.copyButton')}</span>
                  </Button>

                  
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <Card className="bg-muted/50 border-border">
            <CardContent className="p-4">
              <h4 className="font-medium text-sm sm:text-base mb-3 text-foreground">
                {t('pages:qrCode.usage.title')}
              </h4>
              <ul className="text-xs sm:text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>{t('pages:qrCode.usage.point1')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>{t('pages:qrCode.usage.point2')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>{t('pages:qrCode.usage.point3')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>{t('pages:qrCode.usage.point4')}</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}