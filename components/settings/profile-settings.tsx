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

const profileFormSchema = z.object({
  first_name: z.string().min(2, "First name must be at least 2 characters"),
  last_name: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  about: z.string().max(500, "About must be less than 500 characters").optional(),
  practice_area: z.enum([
    "corporate",
    "family",
    "criminal",
    "immigration",
    "intellectual",
    "real-estate",
  ]),
  experience: z.enum(["1", "3", "6", "10"]),
})

type ProfileFormData = z.infer<typeof profileFormSchema>

export default function ProfileSettings() {
  const fileInputRef = useRef<HTMLInputElement>(null)
    const router = useRouter();
  
  const { toast } = useToast()

  const dispatch = useDispatch()
  const profile = useSelector((state: RootState) => state.auth.user);
  console.log("Profile data:", profile)
  const [profile_image, setprofile_image] = useState<string>(profile?.profile_image || "")

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      first_name: profile?.first_name,
      last_name: profile?.last_name,
      email: profile?.email,
      phone: profile?.phone,
      about: profile?.about,
      practice_area: "corporate",
      experience: "3",
    },
  })

  const onSubmit = async (data: ProfileFormData) => {
    try {
      const { email, ...payload } = { ...data, profile_image }
      console.log("Submitting profile data:", payload)
      const res = await updateUser(profile?._id as string, payload)
      if (res && res.data && res.data.success) {
        dispatch(updateUserData({...profile,...payload}))
        toast({
          title: "Profile updated",
          description: "Your profile has been updated successfully.",
          variant: "success",
        })
      } else {
        toast({
          title: "Update Failed",
          description: res?.data?.message || "An unexpected error occurred. Please try again.",
          variant: "error",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "error",
      })
    }
  }

  const handleLogout = async () => {
    try {
      dispatch(logout()) // Clear user data in Redux store
      router.push("/login") // Redirect to login page
      
      
      toast({
        title: "Logged out",
        description: "You have been logged out successfully.",
        variant: "success",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "error",
      })
    }
  }

  const handleAvatarChange = () => {
    fileInputRef.current?.click()
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
            title: "Profile image updated",
            description: "Your avatar has been changed successfully.",
            variant: "success",
          })
        }
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to upload image. Try again.",
          variant: "error",

        })
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h3 className="text-xl font-semibold">Profile Details</h3>
        <Button
          variant="outline"
          className="text-red-600 border-red-200 hover:bg-red-50 sm:w-auto w-full"
          onClick={handleLogout}
        >
          Log Out
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <Avatar className="h-24 w-24">
              <AvatarImage src={profile_image} alt="Profile" />
              <AvatarFallback>
                {form.getValues("first_name")?.[0]}
                {form.getValues("last_name")?.[0]}
              </AvatarFallback>
            </Avatar>
            <Button
              size="icon"
              className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-black hover:bg-gray-800"
              onClick={handleAvatarChange}
            >
              <PencilIcon className="h-4 w-4" />
              <span className="sr-only">Change avatar</span>
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

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter first name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter last name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                disabled
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Enter email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter phone number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="about"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>About</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Write about yourself..." className="min-h-[100px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="practice_area"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Practice Area</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select practice area" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="corporate">Corporate Law</SelectItem>
                        <SelectItem value="family">Family Law</SelectItem>
                        <SelectItem value="criminal">Criminal Law</SelectItem>
                        <SelectItem value="immigration">Immigration Law</SelectItem>
                        <SelectItem value="intellectual">Intellectual Property</SelectItem>
                        <SelectItem value="real-estate">Real Estate Law</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="experience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Years of Experience</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select years" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">1-2 years</SelectItem>
                        <SelectItem value="3">3-5 years</SelectItem>
                        <SelectItem value="6">6-9 years</SelectItem>
                        <SelectItem value="10">10+ years</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-end mt-6 gap-4">
              <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => form.reset()}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-black hover:bg-gray-800 text-white w-full sm:w-auto"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}
