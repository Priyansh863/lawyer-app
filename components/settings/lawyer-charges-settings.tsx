'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, DollarSign, Save, Info } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useTranslation } from '@/hooks/useTranslation'
import { Trans } from 'next-i18next';

interface LawyerChargesSettingsProps {
  userType?: string
}

export default function LawyerChargesSettings({ userType }: LawyerChargesSettingsProps) {
  const [charges, setCharges] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [currentCharges, setCurrentCharges] = useState<number>(0)
  const { toast } = useToast()
  const { t } = useTranslation()

  useEffect(() => {
    fetchCurrentCharges()
  }, [])

  const getToken = () => {
    if (typeof window !== "undefined") {
      const user = localStorage.getItem("user")
      return user ? JSON.parse(user).token : null
    }
    return null
  }

  const fetchCurrentCharges = async () => {
    setLoading(true)
    try {
      const token = getToken()
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/charges/charges/${user._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setCurrentCharges(data.user.charges || 0)
        setCharges(data.user.charges?.toString() || '0')
      }
    } catch (error) {
      console.error('Error fetching charges:', error)
      toast({
        title: t('pages:commonb:error'),
        description: t('pages:chargesSettings:toast.failedToLoad'),
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveCharges = async () => {
    if (!charges || isNaN(Number(charges)) || Number(charges) < 0) {
      toast({
        title: t('pages:chargesSettings:toast.invalidInput.title'),
        description: t('pages:chargesSettings:toast.invalidInput.description'),
        variant: 'destructive'
      })
      return
    }

    setSaving(true)
    try {
      const token = getToken()
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/charges/update-charges`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user._id,
          charges: Number(charges)
        })
      })

      const data = await response.json()

      if (response.ok) {
        setCurrentCharges(Number(charges))
        toast({
          title: t('pages:chargesSettings:toast.success.title'),
          description: t('pages:chargesSettings:toast.success.description'),
        })
      } else {
        throw new Error(data.message || t('chargesSettings:toast.failedToUpdate'))
      }
    } catch (error: any) {
      console.error('Error updating charges:', error)
      toast({
        title: t('pages:commonb:error'),
        description: error.message || t('pages:chargesSettings:toast.failedToUpdate'),
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            {t('pages:chargesSettings:title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          {t('pages:chargesSettings:title')}
        </CardTitle>
        <CardDescription>
          {t('pages:chargesSettings:description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
<Trans
    i18nKey="pages:chargesSettings:currentRate"
    values={{ charges: currentCharges }}
    components={{ strong: <strong /> }}
  />          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="charges">{t('pages:chargesSettings:rateLabel')}</Label>
            <div className="relative">
              <Input
                id="charges"
                type="number"
                min="0"
                step="1"
                value={charges}
                onChange={(e) => setCharges(e.target.value)}
                placeholder={t('pages:chargesSettings:ratePlaceholder')}
                className="pl-8"
              />
              <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              {t('pages:chargesSettings:rateDescription')}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Button 
              onClick={handleSaveCharges} 
              disabled={saving || charges === currentCharges.toString()}
              className="flex items-center gap-2"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? t('pages:chargesSettings:saving') : t('pages:chargesSettings:saveButton')}
            </Button>
            
            {charges !== currentCharges.toString() && (
              <p className="text-sm text-muted-foreground">
                {t('pages:chargesSettings:unsavedChanges')}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}