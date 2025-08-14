"use client"

import { useState, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { PencilIcon, Loader2 } from "lucide-react"
import { useSelector, useDispatch } from "react-redux"
import { RootState } from "@/lib/store"
import { getUploadFileUrl } from "@/lib/helpers/fileupload"
import { updateUser } from "@/services/user"
import { logout, updateUserData } from "@/lib/slices/authSlice"
import { useRouter } from "next/navigation"
import { useToast } from "../ui/use-toast"
import { useTranslation } from "@/hooks/useTranslation"

const profileFormSchema = z.object({
  first_name: z.string().min(2, {
    message: "profile.errors.firstNameMin"
  }),
  last_name: z.string().min(2, {
    message: "profile.errors.lastNameMin"
  }),
  email: z.string().email({
    message: "profile.errors.invalidEmail"
  }),
  phone: z.string().min(10, {
    message: "profile.errors.phoneMin"
  }),
  about: z.string().max(500, {
    message: "profile.errors.aboutMax"
  }).optional(),
  practice_area: z.enum([
    "corporate",
    "family",
    "criminal",
    "immigration",
    "intellectual",
    "real-estate",
  ]),
  experience: z.enum(["1", "3", "6", "10"]).optional(),
})

type ProfileFormData = z.infer<typeof profileFormSchema>

export default function ProfileSettings() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { toast } = useToast()
  const dispatch = useDispatch()
  const profile = useSelector((state: RootState) => state.auth.user)
  const [profile_image, setprofile_image] = useState<string>(profile?.profile_image || "")
  const { t } = useTranslation()

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      first_name: profile?.first_name,
      last_name: profile?.last_name,
      email: profile?.email,
      phone: profile?.phone,
      about: profile?.about,
      practice_area: profile?.practice_area || "corporate",
      experience: profile?.experience || "3",
    },
  })

  const onSubmit = async (data: ProfileFormData) => {
    try {
      const { email, ...payload } = { ...data, profile_image }
      const res = await updateUser(profile?._id as string, payload)
      if (res && res.data && res.data.success) {
        dispatch(updateUserData({ ...profile, ...payload }))
        toast({
          title: t("pages:profileD.profile.toast.success.title"),
          description: t("pages:profileD.profile.toast.success.description"),
          variant: "success",
        })
      } else {
        toast({
          title: t("pages:profileD.profile.toast.error.title"),
          description: res?.data?.message || t("pages:profileD.profile.toast.error.description"),
          variant: "error",
        })
      }
    } catch (error) {
      toast({
        title: t("pages:profileD.profile.toast.error.title"),
        description: t("pages:profileD.profile.toast.error.description"),
        variant: "error",
      })
    }
  }

  const handleLogout = () => {
    dispatch(logout())
    router.push("/login")
    toast({
      title: t("pages:profileD.profile.logout.success.title"),
      description: t("pages:profileD.profile.logout.success.description"),
      variant: "success",
    })
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = async () => {
      try {
        const imageFormat = file.type.split("/")[1]
        const imageData = {
          data: reader.result,
          format: imageFormat,
        }

        const objectUrl = await getUploadFileUrl(profile?._id as string, imageData)
        if (objectUrl) {
          setprofile_image(objectUrl)
          toast({
            title: t("pages:profileD.profile.avatar.success.title"),
            description: t("pages:profileD.profile.avatar.success.description"),
            variant: "success",
          })
        }
      } catch {
        toast({
          title: t("pages:profileD.profile.avatar.error.title"),
          description: t("pages:profileD.profile.avatar.error.description"),
          variant: "error",
        })
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xl font-semibold">{t("pages:profileD.profile.title")}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("pages:profileD.profile.subtitle")}
          </p>
        </div>
        <Button
          variant="outline"
          className="text-red-600 border-red-200 hover:bg-red-50 sm:w-auto w-full"
          onClick={handleLogout}
        >
          {t("pages:profileD.profile.logout.button")}
        </Button>
      </div>

      {/* Body */}
      <div className="flex flex-col md:flex-row gap-8">
        {/* Avatar */}
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <Avatar className="h-24 w-24">
              <AvatarImage src={profile_image} alt={t("pages:profileD.profile.avatar.alt")} />
              <AvatarFallback>
                {form.getValues("first_name")?.[0]}
                {form.getValues("last_name")?.[0]}
              </AvatarFallback>
            </Avatar>
            <Button
              size="icon"
              className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-black hover:bg-gray-800"
              onClick={() => fileInputRef.current?.click()}
            >
              <PencilIcon className="h-4 w-4" />
              <span className="sr-only">{t("pages:profileD.profile.avatar.changeButton")}</span>
            </Button>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
          </div>
          <div className="text-center">
            <h4 className="font-medium">
              {form.watch("first_name")} {form.watch("last_name")}
            </h4>
            <p className="text-sm text-gray-500">{form.watch("email")}</p>
          </div>
        </div>

        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* First Name */}
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("pages:profileD.profile.form.firstName.label")}</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder={t("pages:profileD.profile.form.firstName.placeholder")} 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Last Name */}
              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("pages:profileD.profile.form.lastName.label")}</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder={t("pages:profileD.profile.form.lastName.placeholder")} 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Email */}
              <FormField
                control={form.control}
                disabled
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("pages:profileD.profile.form.email.label")}</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder={t("pages:profileD.profile.form.email.placeholder")} 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Phone */}
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("pages:profileD.profile.form.phone.label")}</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder={t("pages:profileD.profile.form.phone.placeholder")} 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* About */}
              <FormField
                control={form.control}
                name="about"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>{t("pages:profileD.profile.form.about.label")}</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder={t("pages:profileD.profile.form.about.placeholder")} 
                        className="min-h-[100px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Practice Area */}
              {profile?.account_type === "lawyer" && (
                <FormField
                  control={form.control}
                  name="practice_area"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("pages:profileD.profile.form.practiceArea.label")}</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue 
                              placeholder={t("pages:profileD.profile.form.practiceArea.placeholder")} 
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="corporate">
                            {t("pages:profileD.profile.form.practiceArea.options.corporate")}
                          </SelectItem>
                          <SelectItem value="family">
                            {t("pages:profileD.profile.form.practiceArea.options.family")}
                          </SelectItem>
                          <SelectItem value="criminal">
                            {t("pages:profileD.profile.form.practiceArea.options.criminal")}
                          </SelectItem>
                          <SelectItem value="immigration">
                            {t("pages:profileD.profile.form.practiceArea.options.immigration")}
                          </SelectItem>
                          <SelectItem value="intellectual">
                            {t("pages:profileD.profile.form.practiceArea.options.intellectual")}
                          </SelectItem>
                          <SelectItem value="real-estate">
                            {t("pages:profileD.profile.form.practiceArea.options.realEstate")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              {/* Experience */}
              {profile?.account_type === "lawyer" && (
                <FormField
                  control={form.control}
                  name="experience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("pages:profileD.profile.form.experience.label")}</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue 
                              placeholder={t("pages:profileD.profile.form.experience.placeholder")} 
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1">
                            {t("pages:profileD.profile.form.experience.options.1")}
                          </SelectItem>
                          <SelectItem value="3">
                            {t("pages:profileD.profile.form.experience.options.3")}
                          </SelectItem>
                          <SelectItem value="6">
                            {t("pages:profileD.profile.form.experience.options.6")}
                          </SelectItem>
                          <SelectItem value="10">
                            {t("pages:profileD.profile.form.experience.options.10")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Buttons */}
            <div className="mt-6 flex gap-4">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1" 
                onClick={() => form.reset()}
              >
                {t("pages:profileD.profile.buttons.cancel")}
              </Button>
              <Button
                type="submit"
                className="bg-black hover:bg-gray-800 text-white flex-1"
                disabled={form.formState.isSubmitting || !form.formState.isDirty}
              >
                {form.formState.isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {form.formState.isSubmitting 
                  ? t("pages:profileD.profile.buttons.saving") 
                  : t("pages:profileD.profile.buttons.save")}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}