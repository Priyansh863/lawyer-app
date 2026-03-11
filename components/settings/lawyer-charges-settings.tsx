'use client'

import { useState, useEffect, forwardRef, useImperativeHandle } from 'react'
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

export interface LawyerChargesSettingsHandle {
  save: () => Promise<void>;
  isDirty: boolean;
  isSaving: boolean;
}

const LawyerChargesSettings = forwardRef<LawyerChargesSettingsHandle, LawyerChargesSettingsProps>(
  ({ userType }, ref) => {
    const [charges, setCharges] = useState<string>('')
    const [chatRate, setChatRate] = useState<string>('')
    const [videoRate, setVideoRate] = useState<string>('')
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [currentCharges, setCurrentCharges] = useState<number>(0)
    const [currentChatRate, setCurrentChatRate] = useState<number>(0)
    const [currentVideoRate, setCurrentVideoRate] = useState<number>(0)
    const { toast } = useToast()
    const { t } = useTranslation()

    const isDirty = charges !== currentCharges.toString() ||
      chatRate !== currentChatRate.toString() ||
      videoRate !== currentVideoRate.toString();

    useImperativeHandle(ref, () => ({
      save: handleSaveCharges,
      isDirty: isDirty,
      isSaving: saving
    }));

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
          setCurrentChatRate(data.user.chat_rate || 0)
          setCurrentVideoRate(data.user.video_rate || 0)
          setCharges(data.user.charges?.toString() || '0')
          setChatRate(data.user.chat_rate?.toString() || '0')
          setVideoRate(data.user.video_rate?.toString() || '0')
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
      // Validate inputs
      if ((!charges || isNaN(Number(charges)) || Number(charges) < 0) ||
        (!chatRate || isNaN(Number(chatRate)) || Number(chatRate) < 0) ||
        (!videoRate || isNaN(Number(videoRate)) || Number(videoRate) < 0)) {
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
            charges: Number(charges),
            chat_rate: Number(chatRate),
            video_rate: Number(videoRate)
          })
        })

        const data = await response.json()

        if (response.ok) {
          setCurrentCharges(Number(charges))
          setCurrentChatRate(Number(chatRate))
          setCurrentVideoRate(Number(videoRate))
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
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Rates Settings Card */}
        <div className="xl:col-span-8 bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
          <div className="mb-10">
            <h3 className="text-[#0F172A] text-[15px] font-bold leading-relaxed">
              Set your per-minute rates for chat and video consultations. Clients will be charged based on the rates you set.
            </h3>
          </div>

          <div className="space-y-8 max-w-md">
            {/* In-Person Rate */}
            <div className="space-y-3">
              <Label htmlFor="charges" className="text-slate-400 text-[13px] font-bold uppercase tracking-wider">
                In-Person Rate (per minute)
              </Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0F172A] font-bold text-[15px] z-10">
                  $
                </span>
                <Input
                  id="charges"
                  type="number"
                  value={charges}
                  onChange={(e) => setCharges(e.target.value)}
                  className="h-12 w-full bg-[#F1F5F9] border-none rounded-lg pl-8 text-[#0F172A] font-bold text-[15px] focus:ring-2 focus:ring-[#0F172A] transition-all"
                />
              </div>
            </div>

            {/* Video Call Rate */}
            <div className="space-y-3">
              <Label htmlFor="videoRate" className="text-slate-400 text-[13px] font-bold uppercase tracking-wider">
                Video Call Rate (per minute)
              </Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0F172A] font-bold text-[15px] z-10">
                  $
                </span>
                <Input
                  id="videoRate"
                  type="number"
                  value={videoRate}
                  onChange={(e) => setVideoRate(e.target.value)}
                  className="h-12 w-full bg-[#F1F5F9] border-none rounded-lg pl-8 text-[#0F172A] font-bold text-[15px] focus:ring-2 focus:ring-[#0F172A] transition-all"
                />
              </div>
            </div>

            {/* Chat Rate */}
            <div className="space-y-3">
              <Label htmlFor="chatRate" className="text-slate-400 text-[13px] font-bold uppercase tracking-wider">
                Chat Rate (per minute)
              </Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0F172A] font-bold text-[15px] z-10">
                  $
                </span>
                <Input
                  id="chatRate"
                  type="number"
                  value={chatRate}
                  onChange={(e) => setChatRate(e.target.value)}
                  className="h-12 w-full bg-[#F1F5F9] border-none rounded-lg pl-8 text-[#0F172A] font-bold text-[15px] focus:ring-2 focus:ring-[#0F172A] transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Unsaved Changes Prompt Card */}
        {isDirty && (
          <div className="xl:col-span-4 self-center pt-8 xl:pt-0 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm text-center">
              <h4 className="text-[#0F172A] text-[18px] font-bold mb-3">
                Leave without saving?
              </h4>
              <p className="text-slate-500 text-[14px] font-medium mb-8">
                You have unsaved changes. They will be lost if you leave this page.
              </p>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCharges(currentCharges.toString());
                    setChatRate(currentChatRate.toString());
                    setVideoRate(currentVideoRate.toString());
                  }}
                  className="flex-1 h-11 border-slate-200 text-slate-600 font-bold rounded-md hover:bg-slate-50 transition-all font-sans"
                >
                  Discard
                </Button>
                <Button
                  onClick={handleSaveCharges}
                  disabled={saving}
                  className="flex-1 h-11 bg-[#0F172A] hover:bg-[#1E293B] text-white font-bold rounded-md transition-all font-sans"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save & leave"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }
)

LawyerChargesSettings.displayName = 'LawyerChargesSettings'

export default LawyerChargesSettings