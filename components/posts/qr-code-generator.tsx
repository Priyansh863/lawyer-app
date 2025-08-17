"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { QrCode, Download, Share2, Copy, ExternalLink } from 'lucide-react'
import { Post } from '@/lib/api/posts-api'
import QRCode from 'qrcode'

interface QrCodeGeneratorProps {
  post: Post
  trigger?: React.ReactNode
}

export default function QrCodeGenerator({ post, trigger }: QrCodeGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [qrCodeData, setQrCodeData] = useState<string | null>(post.qrCodeUrl || null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  const handleGenerateQrCode = async () => {
    try {
      setIsGenerating(true)
      const postUrl = post.customUrl || `${window.location.origin}/${post.slug}`
      
      // Generate QR code on frontend
      const qrCodeDataUrl = await QRCode.toDataURL(postUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
      
      setQrCodeData(qrCodeDataUrl)
      toast.success('QR Code Generated', {
        description: 'QR code has been generated successfully!'
      })
    } catch (error: any) {
      console.error('Error generating QR code:', error)
      toast.error('Generation Error', {
        description: 'An error occurred while generating the QR code'
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownloadQrCode = async () => {
    if (!qrCodeData) return

    try {
      setIsDownloading(true)
      
      // Create a temporary link to download the QR code
      const link = document.createElement('a')
      link.href = qrCodeData
      link.download = `${post.slug}-qr-code.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success('Download Started', {
        description: 'QR code is being downloaded'
      })
    } catch (error) {
      console.error('Error downloading QR code:', error)
      toast.error('Download Failed', {
        description: 'Failed to download QR code'
      })
    } finally {
      setIsDownloading(false)
    }
  }

  const handleCopyPostUrl = async () => {
    const postUrl = post.customUrl || `${window.location.origin}/${post.slug}`
    
    try {
      await navigator.clipboard.writeText(postUrl)
      toast.success('URL Copied', {
        description: 'Post URL has been copied to clipboard'
      })
    } catch (error) {
      console.error('Error copying URL:', error)
      toast.error('Copy Failed', {
        description: 'Failed to copy URL to clipboard'
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
        console.error('Error sharing:', error)
      }
    } else {
      // Fallback to copying URL
      handleCopyPostUrl()
    }
  }

  const postUrl = post.customUrl || `${window.location.origin}/${post.slug}`

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <QrCode className="h-4 w-4 mr-2" />
            QR Code
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            QR Code for Post
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Post Info */}
          <Card>
            <CardContent className="pt-4">
              <h3 className="font-medium text-sm mb-2">{post.title}</h3>
              <p className="text-xs text-gray-600 mb-3">
                {post.content.substring(0, 100)}...
              </p>
              <div className="flex items-center gap-2 text-xs text-blue-600">
                <ExternalLink className="h-3 w-3" />
                <span className="truncate">{postUrl}</span>
              </div>
            </CardContent>
          </Card>

          {/* QR Code Display */}
          <Card>
            <CardContent className="pt-4">
              {qrCodeData ? (
                <div className="text-center space-y-4">
                  <div className="bg-white p-4 rounded-lg border inline-block">
                    <img 
                      src={qrCodeData} 
                      alt="QR Code" 
                      className="w-48 h-48 mx-auto"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  </div>
                  <p className="text-xs text-gray-600">
                    Scan this QR code to open the post
                  </p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <QrCode className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-sm text-gray-600 mb-4">
                    Generate a QR code for this post
                  </p>
                  <Button 
                    onClick={handleGenerateQrCode}
                    disabled={isGenerating}
                    className="w-full"
                  >
                    {isGenerating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <QrCode className="h-4 w-4 mr-2" />
                        Generate QR Code
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          {qrCodeData && (
            <div className="flex gap-2">
              <Button 
                onClick={handleDownloadQrCode}
                disabled={isDownloading}
                className="flex-1"
              >
                {isDownloading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </>
                )}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleCopyPostUrl}
                className="flex-1"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy URL
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleSharePost}
                className="flex-1"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          )}

          {/* Instructions */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-4">
              <h4 className="font-medium text-sm mb-2 text-blue-800">How to use:</h4>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Generate a QR code for easy sharing</li>
                <li>• Download the QR code as PNG image</li>
                <li>• Anyone can scan to open your post</li>
                <li>• Perfect for business cards, flyers, or presentations</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
