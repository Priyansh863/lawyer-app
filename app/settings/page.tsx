"use client"

import { useState, useEffect, useRef } from "react"
import { useSelector, useDispatch } from "react-redux"
import { RootState } from "@/lib/store"
import { useTranslation } from "@/hooks/useTranslation"
import { useI18n } from "@/contexts/i18nContext"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Plus, Loader2, Save, X, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import LawyerChargesSettings, { LawyerChargesSettingsHandle } from "@/components/settings/lawyer-charges-settings"
import PcIdSettings from "@/components/settings/pc-id-settings"
import { toast } from "@/hooks/use-toast"
import { useForm } from "react-hook-form"
import { updateUser } from "@/services/user"
import { updateUserData, logout } from "@/lib/slices/authSlice"

export default function SettingsPage() {
  const profile = useSelector((state: RootState) => state.auth.user)
  const dispatch = useDispatch()
  const router = useRouter()
  const { t } = useTranslation()
  const { language, setLanguage } = useI18n()
  const { theme = "light", setTheme } = useTheme()
  const [activeTab, setActiveTab] = useState<'profile' | 'rates' | 'pc-id'>('profile')
  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const ratesRef = useRef<LawyerChargesSettingsHandle>(null)

  const { register, handleSubmit, reset, watch } = useForm({
    defaultValues: {
      first_name: profile?.first_name || "",
      last_name: profile?.last_name || "",
      email: profile?.email || "",
      phone: profile?.phone || "",
      // NOTE: backend field is spelled 'pratice_area'
      pratice_area: (profile as any)?.pratice_area || "",
      experience: (profile as any)?.experience || "",
      address_line1: (profile as any)?.address_line1 || "",
      address_line2: (profile as any)?.address_line2 || "",
      city: (profile as any)?.city || "",
      state: (profile as any)?.state || "",
      postal_code: (profile as any)?.postal_code || "",
      country: (profile as any)?.country || "",
    }
  })

  // Reset form when profile changes or editing is toggled
  useEffect(() => {
    if (!isEditing) {
      reset({
        first_name: profile?.first_name || "",
        last_name: profile?.last_name || "",
        email: profile?.email || "",
        phone: profile?.phone || "",
        pratice_area: (profile as any)?.pratice_area || "",
        experience: (profile as any)?.experience || "",
        address_line1: (profile as any)?.address_line1 || "",
        address_line2: (profile as any)?.address_line2 || "",
        city: (profile as any)?.city || "",
        state: (profile as any)?.state || "",
        postal_code: (profile as any)?.postal_code || "",
        country: (profile as any)?.country || "",
      })
    }
  }, [profile, isEditing, reset])

  const handleLanguageChange = (val: string) => {
    setLanguage(val as any)
    toast({
      description: t('pages:settings.languageUpdated'),
    })
  }

  const onSubmit = async (data: any) => {
    setIsSubmitting(true)
    try {
      // Remove email from update as it's usually protected
      const { email, ...payload } = data
      const res = await updateUser(profile?._id as string, payload)

      if (res && res.data && res.data.success) {
        const updatedUser = { ...profile, ...payload }
        dispatch(updateUserData(updatedUser))
        if (typeof window !== "undefined") {
          window.localStorage.setItem("user", JSON.stringify(updatedUser))
        }
        setIsEditing(false)
        toast({
          title: t('pages:settings.profileUpdated'),
          description: t('pages:settings.profileUpdatedDesc'),
        })
      } else {
        toast({
          title: t('pages:settings.updateFailed'),
          description: res?.data?.message || t('pages:settings.unexpectedError'),
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: t('pages:settings.updateFailed'),
        description: t('pages:settings.unexpectedError'),
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaveRates = async () => {
    if (ratesRef.current) {
      setIsSubmitting(true)
      await ratesRef.current.save()
      setIsSubmitting(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("user")
    localStorage.removeItem("token")
    dispatch(logout())
    router.replace("/login")
  }

  return (
    <div className="pt-1 pb-4 px-2 max-w-[1700px] mx-auto">
      <div className="flex flex-col space-y-6">
        {/* Header Section */}
        <div className="flex justify-between items-center px-1">
          <h1 className="text-[22px] font-bold text-[#0F172A] tracking-tight">
            {t('pages:settings.title')}
          </h1>
        </div>

        {/* Tabs & Action Row */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-1">
          <div className="flex items-center gap-8">
            <button
              onClick={() => { setActiveTab('profile'); setIsEditing(false); }}
              className={cn(
                "relative pb-3 text-[15px] font-bold transition-all",
                activeTab === 'profile'
                  ? "text-[#0F172A] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#0F172A]"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              {t('pages:settings.profileSettings')}
            </button>
            {profile?.account_type === 'lawyer' && (
              <button
                onClick={() => { setActiveTab('rates'); setIsEditing(false); }}
                className={cn(
                  "relative pb-3 text-[15px] font-bold transition-all",
                  activeTab === 'rates'
                    ? "text-[#0F172A] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#0F172A]"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                {t('pages:settings.consultationRates')}
              </button>
            )}
            <button
              onClick={() => { setActiveTab('pc-id'); setIsEditing(false); }}
              className={cn(
                "relative pb-3 text-[15px] font-bold transition-all",
                activeTab === 'pc-id'
                  ? "text-[#0F172A] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#0F172A]"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              {t('pages:settings.pcLicense')}
            </button>
          </div>

          <div className="flex items-center gap-3 pb-1">
            {activeTab === 'profile' && (
              isEditing ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    className="border-slate-200 text-slate-600 font-bold h-10 px-6 rounded-md text-[13px] hover:bg-slate-50"
                  >
                    <X className="h-4 w-4 mr-2" />
                    {t('pages:settings.cancel')}
                  </Button>
                  <Button
                    onClick={handleSubmit(onSubmit)}
                    disabled={isSubmitting}
                    className="bg-[#0F172A] hover:bg-[#1E293B] text-white font-bold h-10 px-6 rounded-md text-[13px] transition-all"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    {t('pages:settings.saveChanges')}
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => setIsEditing(true)}
                  className="bg-[#0F172A] hover:bg-[#1E293B] text-white font-bold h-10 px-6 rounded-md text-[13px] transition-all"
                >
                  {t('pages:settings.editProfile')}
                </Button>
              )
            )}

            {activeTab === 'rates' && (
              <Button
                onClick={handleSaveRates}
                disabled={isSubmitting}
                className="bg-[#0F172A] hover:bg-[#1E293B] text-white font-bold h-10 px-6 rounded-md text-[13px] transition-all"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {t('pages:settings.saveRates')}
              </Button>
            )}
          </div>
        </div>

        <div className="mt-8">
          {activeTab === 'profile' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Summary Cards */}
              <div className="lg:col-span-4 space-y-4">
                {/* Profile Summary Card */}
                <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm flex flex-col items-center text-center">
                  <div className="relative mb-6">
                    <Avatar className="h-32 w-32 border-4 border-slate-50 shadow-sm">
                      <AvatarImage src={profile?.profile_image} />
                      <AvatarFallback className="text-3xl bg-slate-100 text-slate-400">
                        {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <button className="absolute bottom-1 right-1 h-8 w-8 bg-[#0F172A] rounded-full flex items-center justify-center text-white border-2 border-white shadow-md hover:bg-[#1E293B] transition-all">
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="space-y-1">
                    <h2 className="text-[20px] font-bold text-[#0F172A]">
                      {watch('first_name')} {watch('last_name')}
                    </h2>
                    <p className="text-slate-500 font-medium text-[14px]">
                      {profile?.email}
                    </p>
                  </div>

                  <div className="mt-6 pt-6 border-t border-slate-100 w-full">
                    <p className="text-slate-400 text-[12px] font-bold uppercase tracking-wider mb-1">
                      {t('pages:settings.memberSince')}
                    </p>
                    <p className="text-[#0F172A] font-bold text-[14px]">
                      {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      }) : '--'}
                    </p>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
                  <div className="space-y-3">
                    <label className="text-slate-400 text-[12px] font-black uppercase tracking-wider px-1">
                      {t('pages:settings.languageSettings')}
                    </label>
                    <Select value={language} onValueChange={handleLanguageChange}>
                      <SelectTrigger className="h-12 bg-[#F1F5F9] border-none rounded-lg text-sm font-bold text-[#0F172A] focus:ring-0">
                        <SelectValue placeholder={t('pages:settings.selectLanguage')} />
                      </SelectTrigger>
                      <SelectContent className="border-slate-200 shadow-xl rounded-xl">
                        <SelectItem value="en" className="font-bold text-[13px] py-2.5">{t('pages:settings.english')}</SelectItem>
                        <SelectItem value="ko" className="font-bold text-[13px] py-2.5">{t('pages:settings.korean')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <label className="text-slate-400 text-[12px] font-black uppercase tracking-wider px-1">
                      {t('pages:settings.displaySettings')}
                    </label>
                    <Select
                      value={theme === "dark" ? "dark" : "light"}
                      onValueChange={(v) => setTheme(v as "light" | "dark")}
                    >
                      <SelectTrigger className="h-12 bg-[#F1F5F9] border-none rounded-lg text-sm font-bold text-[#0F172A] focus:ring-0">
                        <SelectValue placeholder={t('pages:settings.selectTheme')} />
                      </SelectTrigger>
                      <SelectContent className="border-slate-200 shadow-xl rounded-xl">
                        <SelectItem value="light" className="font-bold text-[13px] py-2.5">{t('pages:settings.lightMode')}</SelectItem>
                        <SelectItem value="dark" className="font-bold text-[13px] py-2.5">{t('pages:settings.darkMode')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Logout Card */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <Button
                    onClick={handleLogout}
                    variant="ghost"
                    className="w-full justify-start text-red-500 hover:text-red-700 hover:bg-red-50 font-bold h-12 rounded-lg gap-3 transition-all"
                  >
                    <LogOut className="h-5 w-5" />
                    {t('pages:settings.logout')}
                  </Button>
                </div>
              </div>

              {/* Right Column: Profile Data Fields */}
              <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
                <form id="profile-form" className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  <div className="space-y-2">
                    <label className="text-slate-400 text-[13px] font-bold">{t('pages:settings.firstName')}</label>
                    <Input
                      {...register('first_name')}
                      readOnly={!isEditing}
                      className={cn(
                        "h-12 border-none rounded-lg text-[#0F172A] font-bold",
                        isEditing ? "bg-white ring-1 ring-slate-200 focus:ring-2 focus:ring-[#0F172A]" : "bg-[#F1F5F9]"
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-slate-400 text-[13px] font-bold">{t('pages:settings.lastName')}</label>
                    <Input
                      {...register('last_name')}
                      readOnly={!isEditing}
                      className={cn(
                        "h-12 border-none rounded-lg text-[#0F172A] font-bold",
                        isEditing ? "bg-white ring-1 ring-slate-200 focus:ring-2 focus:ring-[#0F172A]" : "bg-[#F1F5F9]"
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-slate-400 text-[13px] font-bold">{t('pages:settings.email')}</label>
                    <Input
                      {...register('email')}
                      readOnly={true} // Email typically not editable
                      className="h-12 bg-[#F1F5F9] border-none rounded-lg text-[#0F172A] font-bold opacity-70"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-slate-400 text-[13px] font-bold">{t('pages:settings.contactNumber')}</label>
                    <Input
                      {...register('phone')}
                      readOnly={!isEditing}
                      className={cn(
                        "h-12 border-none rounded-lg text-[#0F172A] font-bold",
                        isEditing ? "bg-white ring-1 ring-slate-200 focus:ring-2 focus:ring-[#0F172A]" : "bg-[#F1F5F9]"
                      )}
                    />
                  </div>

                  {profile?.account_type === 'lawyer' && (
                    <>
                      <div className="space-y-2">
                        <label className="text-slate-400 text-[13px] font-bold">{t('pages:settings.specialization')}</label>
                        <Input
                          {...register('pratice_area')}
                          readOnly={!isEditing}
                          className={cn(
                            "h-12 border-none rounded-lg text-[#0F172A] font-bold",
                            isEditing ? "bg-white ring-1 ring-slate-200 focus:ring-2 focus:ring-[#0F172A]" : "bg-[#F1F5F9]"
                          )}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-slate-400 text-[13px] font-bold">{t('pages:settings.experienceYears')}</label>
                        <Input
                          {...register('experience')}
                          readOnly={!isEditing}
                          className={cn(
                            "h-12 border-none rounded-lg text-[#0F172A] font-bold",
                            isEditing ? "bg-white ring-1 ring-slate-200 focus:ring-2 focus:ring-[#0F172A]" : "bg-[#F1F5F9]"
                          )}
                        />
                      </div>
                    </>
                  )}

                  <div className="col-span-1 md:col-span-2 space-y-2">
                    <label className="text-slate-400 text-[13px] font-bold">{t('pages:settings.address1')}</label>
                    <Input
                      {...register('address_line1')}
                      readOnly={!isEditing}
                      className={cn(
                        "h-12 border-none rounded-lg text-[#0F172A] font-bold",
                        isEditing ? "bg-white ring-1 ring-slate-200 focus:ring-2 focus:ring-[#0F172A]" : "bg-[#F1F5F9]"
                      )}
                    />
                  </div>
                  <div className="col-span-1 md:col-span-2 space-y-2">
                    <label className="text-slate-400 text-[13px] font-bold">{t('pages:settings.address2')}</label>
                    <Input
                      {...register('address_line2')}
                      readOnly={!isEditing}
                      className={cn(
                        "h-12 border-none rounded-lg text-[#0F172A] font-bold",
                        isEditing ? "bg-white ring-1 ring-slate-200 focus:ring-2 focus:ring-[#0F172A]" : "bg-[#F1F5F9]"
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-slate-400 text-[13px] font-bold">{t('pages:settings.city')}</label>
                    <Input
                      {...register('city')}
                      readOnly={!isEditing}
                      className={cn(
                        "h-12 border-none rounded-lg text-[#0F172A] font-bold",
                        isEditing ? "bg-white ring-1 ring-slate-200 focus:ring-2 focus:ring-[#0F172A]" : "bg-[#F1F5F9]"
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-slate-400 text-[13px] font-bold">{t('pages:settings.stateProvince')}</label>
                    <Input
                      {...register('state')}
                      readOnly={!isEditing}
                      className={cn(
                        "h-12 border-none rounded-lg text-[#0F172A] font-bold",
                        isEditing ? "bg-white ring-1 ring-slate-200 focus:ring-2 focus:ring-[#0F172A]" : "bg-[#F1F5F9]"
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-slate-400 text-[13px] font-bold">{t('pages:settings.postalCode')}</label>
                    <Input
                      {...register('postal_code')}
                      readOnly={!isEditing}
                      className={cn(
                        "h-12 border-none rounded-lg text-[#0F172A] font-bold",
                        isEditing ? "bg-white ring-1 ring-slate-200 focus:ring-2 focus:ring-[#0F172A]" : "bg-[#F1F5F9]"
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-slate-400 text-[13px] font-bold">{t('pages:settings.country')}</label>
                    <Input
                      {...register('country')}
                      readOnly={!isEditing}
                      className={cn(
                        "h-12 border-none rounded-lg text-[#0F172A] font-bold",
                        isEditing ? "bg-white ring-1 ring-slate-200 focus:ring-2 focus:ring-[#0F172A]" : "bg-[#F1F5F9]"
                      )}
                    />
                  </div>
                </form>
              </div>
            </div>
          ) : activeTab === 'rates' ? (
            <div className="space-y-6">
              <LawyerChargesSettings ref={ratesRef} />
            </div>
          ) : (
            <div className="space-y-6">
              <PcIdSettings />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
