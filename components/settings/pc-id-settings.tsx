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
        title: t('pages:commonb:error') || 'Error',
        description: 'Please enter a PC Unique ID',
        variant: 'destructive'
      })
      return
    }

    setSaving(true)
    try {
      const token = getToken()
      
      if (!token) {
        toast({
          title: 'Authentication Error',
          description: 'You are not logged in. Please log in and try again.',
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
          title: 'Success',
          description: 'PC linked successfully',
          variant: 'default'
        })
      } else {
        // Handle different error status codes
        let errorMessage = data.message || 'Failed to save PC ID'
        
        if (response.status === 401) {
          errorMessage = 'User not logged in. Please log in and try again.'
        } else if (response.status === 400) {
          errorMessage = 'Invalid PC ID. Please check and try again.'
        } else if (response.status === 409) {
          errorMessage = 'PC ID already registered. Please use a different PC ID.'
        }

        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive'
        })
      }
    } catch (error: any) {
      console.error('Error saving PC ID:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to save PC ID. Please try again.',
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
          title: 'Authentication Error',
          description: 'You are not logged in. Please log in and try again.',
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
          title: 'Success',
          description: 'PC license reset successfully. Please register your PC again.',
          variant: 'default'
        })
        // Clear the PC ID input field after successful reset
        setPcId('')
      } else {
        let errorMessage = data.message || 'Failed to reset PC license'
        
        if (response.status === 401) {
          errorMessage = 'User not logged in. Please log in and try again.'
        } else if (response.status === 403) {
          errorMessage = 'You do not have permission to reset PC license.'
        }

        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive'
        })
      }
    } catch (error: any) {
      console.error('Error resetting PC license:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to reset PC license. Please try again.',
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
          PC Unique ID
        </CardTitle>
        <CardDescription>
          Link your PC by entering a unique identifier
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="pcId">PC Unique ID</Label>
          <div className="flex gap-2">
            <Input
              id="pcId"
              type="text"
              value={pcId}
              onChange={(e) => setPcId(e.target.value)}
              placeholder="Enter PC Unique ID"
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
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
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
            {resetting ? 'Resetting...' : 'Reset PC License'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}


