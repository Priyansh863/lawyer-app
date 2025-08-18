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
      const postUrl = post.customUrl || `${window.location.origin}/${post.slug}`
      
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
    const postUrl = post.customUrl || `${window.location.origin}/${post.slug}`
    
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
    const postUrl = post.customUrl || `${window.location.origin}/${post.slug}`
    
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

  const postUrl = post.customUrl || `${window.location.origin}/${post.slug}`

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <QrCode className="h-4 w-4" />
            {t('pages:qrCode.button')}
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md max-h-[30rem] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            {t('pages:qrCode.dialogTitle', { title: post.title })}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Post Info */}
          <Card className="border-gray-200">
            <CardContent className="pt-4">
              <h3 className="font-medium text-sm mb-2 line-clamp-1">{post.title}</h3>
              <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                {post.content.substring(0, 100)}...
              </p>
              <div className="flex items-center gap-2 text-xs text-blue-600">
                <ExternalLink className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{postUrl}</span>
              </div>
            </CardContent>
          </Card>

          {/* QR Code Display */}
          <Card className="border-gray-200">
            <CardContent className="pt-4">
              {qrCodeData ? (
                <div className="text-center space-y-4">
                  <div className="bg-white p-4 rounded-lg border border-gray-200 inline-block">
                    <img 
                      src={qrCodeData} 
                      alt={t('pages:qrCode.altText')} 
                      className="w-48 h-48 mx-auto"
                      style={{ imageRendering: 'crisp-edges' }}
                    />
                  </div>
                  <p className="text-xs text-gray-600">
                    {t('pages:qrCode.scanInstructions')}
                  </p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <QrCode className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-sm text-gray-600 mb-4">
                    {t('pages:qrCode.generatePrompt')}
                  </p>
                  <Button 
                    onClick={handleGenerateQrCode}
                    disabled={isGenerating}
                    className="w-full gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        {t('pages:qrCode.generating')}
                      </>
                    ) : (
                      <>
                        <QrCode className="h-4 w-4" />
                        {t('pages:qrCode.generateButton')}
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          {qrCodeData && (
            <div className="grid grid-cols-2 gap-2">
              <Button 
                onClick={handleDownloadQrCode}
                disabled={isDownloading}
                className="gap-2"
              >
                {isDownloading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    {t('pages:qrCode.downloading')}
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    {t('pages:qrCode.downloadButton')}
                  </>
                )}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleCopyPostUrl}
                className="gap-2"
              >
                <Copy className="h-4 w-4" />
                {t('pages:qrCode.copyButton')}
              </Button>
              
              
            </div>
          )}

          {/* Instructions */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-4">
              <h4 className="font-medium text-sm mb-2 text-blue-800">
                {t('pages:qrCode.usage.title')}
              </h4>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• {t('pages:qrCode.usage.point1')}</li>
                <li>• {t('pages:qrCode.usage.point2')}</li>
                <li>• {t('pages:qrCode.usage.point3')}</li>
                <li>• {t('pages:qrCode.usage.point4')}</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}