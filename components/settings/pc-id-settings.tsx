'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Save, Computer, RotateCcw } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useTranslation } from '@/hooks/useTranslation'

export default function PcIdSettings() {
  const [pcId, setPcId] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [resetting, setResetting] = useState(false)
  const { toast } = useToast()
  const { t } = useTranslation()

  const getToken = () => {
    if (typeof window !== "undefined") {
      const user = localStorage.getItem("user")
      return user ? JSON.parse(user).token : null
    }
    return null
  }

  const handleSavePcId = async () => {
    // Validate input
    if (!pcId || pcId.trim() === '') {
      toast({
        title: t('pages:pcId.toast.error.title') || 'Error',
        description: t('pages:pcId.form.validation.pcIdRequired'),
        variant: 'destructive'
      })
      return
    }

    setSaving(true)
    try {
      const token = getToken()
      
      if (!token) {
        toast({
          title: t('pages:pcId.toast.authError.title'),
          description: t('pages:pcId.toast.authError.description'),
          variant: 'destructive'
        })
        setSaving(false)
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/save-pc-id`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          pcId: pcId.trim()
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: t('pages:pcId.toast.saveSuccess.title'),
          description: t('pages:pcId.toast.saveSuccess.description'),
          variant: 'default'
        })
      } else {
        // Handle different error status codes
        let errorMessage = data.message || t('pages:pcId.toast.saveError.default')
        
        if (response.status === 401) {
          errorMessage = t('pages:pcId.toast.authError.description')
        } else if (response.status === 400) {
          errorMessage = t('pages:pcId.toast.saveError.invalidPcId')
        } else if (response.status === 409) {
          errorMessage = t('pages:pcId.toast.saveError.pcIdExists')
        }

        toast({
          title: t('pages:pcId.toast.error.title'),
          description: errorMessage,
          variant: 'destructive'
        })
      }
    } catch (error: any) {
      console.error('Error saving PC ID:', error)
      toast({
        title: t('pages:pcId.toast.error.title'),
        description: error.message || t('pages:pcId.toast.saveError.default'),
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleResetPcLicense = async () => {
    setResetting(true)
    try {
      const token = getToken()
      
      if (!token) {
        toast({
          title: t('pages:pcId.toast.authError.title'),
          description: t('pages:pcId.toast.authError.description'),
          variant: 'destructive'
        })
        setResetting(false)
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reset-pc-license`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: t('pages:pcId.toast.resetSuccess.title'),
          description: t('pages:pcId.toast.resetSuccess.description'),
          variant: 'default'
        })
        // Clear the PC ID input field after successful reset
        setPcId('')
      } else {
        let errorMessage = data.message || t('pages:pcId.toast.resetError.default')
        
        if (response.status === 401) {
          errorMessage = t('pages:pcId.toast.authError.description')
        } else if (response.status === 403) {
          errorMessage = t('pages:pcId.toast.resetError.noPermission')
        }

        toast({
          title: t('pages:pcId.toast.error.title'),
          description: errorMessage,
          variant: 'destructive'
        })
      }
    } catch (error: any) {
      console.error('Error resetting PC license:', error)
      toast({
        title: t('pages:pcId.toast.error.title'),
        description: error.message || t('pages:pcId.toast.resetError.default'),
        variant: 'destructive'
      })
    } finally {
      setResetting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Computer className="h-5 w-5" />
          {t('pages:pcId.title')}
        </CardTitle>
        <CardDescription>
          {t('pages:pcId.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="pcId">{t('pages:pcId.form.pcId.label')}</Label>
          <div className="flex gap-2">
            <Input
              id="pcId"
              type="text"
              value={pcId}
              onChange={(e) => setPcId(e.target.value)}
              placeholder={t('pages:pcId.form.pcId.placeholder')}
              className="flex-1"
              disabled={saving || resetting}
            />
            <Button
              onClick={handleSavePcId}
              disabled={saving || resetting || !pcId.trim()}
              className="flex items-center gap-2"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? t('pages:pcId.buttons.saving') : t('pages:pcId.buttons.save')}
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <Button
            onClick={handleResetPcLicense}
            disabled={resetting || saving}
            variant="outline"
            className="w-full flex items-center gap-2"
          >
            {resetting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RotateCcw className="h-4 w-4" />
            )}
            {resetting ? t('pages:pcId.buttons.resetting') : t('pages:pcId.buttons.resetLicense')}
          </Button>
         
        </div>
      </CardContent>
    </Card>
  )
}