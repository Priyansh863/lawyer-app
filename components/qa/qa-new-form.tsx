"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useSelector } from "react-redux"
import { RootState } from "@/lib/store"
import { useState, useEffect } from "react"
import { 
  MessageSquare, 
  User, 
  Globe, 
  Star, 
  Users, 
  Loader2,
  CheckCircle,
  AlertCircle
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/hooks/useTranslation"
import { createQuestion, getLawyers, type CreateQAData } from "@/lib/api/qa-api"

const qaSchema = z.object({
  question: z.string().min(10, "Question must be at least 10 characters"),
  category: z.string().min(1, "Please select a category"),
  tags: z.string().optional(),
  selectedLawyer: z.string().optional(), // Optional lawyer selection
})

type QAFormData = z.infer<typeof qaSchema>

interface Lawyer {
  _id: string
  first_name: string
  last_name: string
  email: string
  specialization?: string[]
  rating?: number
  experience_years?: number
  profile_image?: string
  chat_fee?: number
  is_available?: boolean
}

// No local API functions needed - using centralized API service

export default function QANewFormEnhanced() {
  const router = useRouter()
  const user = useSelector((state: RootState) => state.auth.user)
  const { toast } = useToast()
  const { t } = useTranslation()
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [lawyers, setLawyers] = useState<Lawyer[]>([])
  const [loadingLawyers, setLoadingLawyers] = useState(true)
  const [selectedLawyer, setSelectedLawyer] = useState<Lawyer | null>(null)

  const form = useForm<QAFormData>({
    resolver: zodResolver(qaSchema),
    defaultValues: {
      question: "",
      category: "general",
      tags: "",
      selectedLawyer: "",
    },
  })

  // Load lawyers on component mount
  useEffect(() => {
    loadLawyers()
  }, [])

  const loadLawyers = async () => {
    try {
      setLoadingLawyers(true)
      const lawyersData = await getLawyers()
      setLawyers(lawyersData || [])
    } catch (error) {
      console.error('Error loading lawyers:', error)
      // Set empty array to prevent UI issues
      setLawyers([])
      toast({
        title: "Unable to load lawyers",
        description: "The Q&A system will still work without lawyer selection.",
        variant: "destructive"
      })
    } finally {
      setLoadingLawyers(false)
    }
  }

  const onSubmit = async (data: QAFormData) => {
    if (!user?._id) {
      toast({
        title: t("pages:questionform.authentication_required"),
        description: t("pages:questionform.please_log_in_to_submit_question"),
        variant: "destructive"
      })
      return
    }

    try {
      setIsSubmitting(true)
      
      const questionData: CreateQAData = {
        title: data.question.substring(0, 100), // Use first 100 chars as title
        question: data.question,
        category: data.category,
        tags: data.tags ? data.tags.split(',').map(tag => tag.trim()) : [],
        selectedLawyer: data.selectedLawyer || undefined,
        clientId: user._id as string,
        isPublic: true,
        isAnonymous: false
      }

      const response = await createQuestion(questionData)

      if (response.success) {
        toast({
          title: t("pages:questionform.question_submitted"),
          description: t("pages:questionform.question_posted_publicly")
        })
        
        // Reset form
        form.reset()
        setSelectedLawyer(null)
        
        // Redirect to Q&A list
        router.push('/qa')
      } else {
        throw new Error(response.message || t('pages:questionform.submission_failed'))
      }
    } catch (error: any) {
      console.error('Error submitting Q&A:', error)
      toast({
        title: t("pages:questionform.submission_failed"),
        description: error.message || t("pages:questionform.failed_to_submit_question_try_again"),
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLawyerSelect = (lawyerId: string) => {
    const lawyer = lawyers.find(l => l._id === lawyerId)
    setSelectedLawyer(lawyer || null)
    form.setValue('selectedLawyer', lawyerId)
  }

  const categories = [
    { value: "general", label: t("pages:questionform.general_legal") },
    { value: "criminal", label: t("pages:questionform.criminal_law") },
    { value: "civil", label: t("pages:questionform.civil_law") },
    { value: "family", label: t("pages:questionform.family_law") },
    { value: "business", label: t("pages:questionform.business_law") },
    { value: "property", label: t("pages:questionform.property_law") },
    { value: "employment", label: t("pages:questionform.employment_law") },
    { value: "immigration", label: t("pages:questionform.immigration_law") },
    { value: "tax", label: t("pages:questionform.tax_law") },
    { value: "intellectual-property", label: t("pages:questionform.intellectual_property") }
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center justify-center gap-2">
          <MessageSquare className="h-8 w-8 text-blue-500" />
          {t("pages:questionform.ask_legal_question")}
        </h1>
        <p className="text-muted-foreground">
          {t("pages:questionform.submit_legal_question_publicly")}
        </p>
        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Globe className="h-4 w-4 text-green-500" />
            <span>{t("pages:questionform.public_qa")}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4 text-blue-500" />
            <span>{t("pages:questionform.all_lawyers_can_respond")}</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle className="h-4 w-4 text-emerald-500" />
            <span>{t("pages:questionform.free_to_ask")}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Question Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                {t("pages:questionform.your_question")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Question */}
                  <FormField
                    control={form.control}
                    name="question"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("pages:questionform.legal_question")} *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={t("pages:questionform.describe_legal_question_placeholder")}
                            className="min-h-32"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Category */}
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("pages:questionform.legal_category")} *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("pages:questionform.select_legal_category")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.value} value={category.value}>
                                {category.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Tags */}
                  <FormField
                    control={form.control}
                    name="tags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("pages:questionform.tags_optional")}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t("pages:questionform.tags_placeholder")}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

               

                  {/* Submit Button */}
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t("pages:questionform.submitting_question")}
                      </>
                    ) : (
                      <>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        {t("pages:questionform.submit_public_question")}
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Selected Lawyer Info */}
          {selectedLawyer && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t("selected_lawyer")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={selectedLawyer.profile_image} />
                      <AvatarFallback>
                        {selectedLawyer.first_name[0]}{selectedLawyer.last_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {selectedLawyer.first_name} {selectedLawyer.last_name}
                      </p>
                      {selectedLawyer.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm">{selectedLawyer.rating}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {selectedLawyer.specialization && (
                    <div className="flex flex-wrap gap-1">
                      {selectedLawyer.specialization.slice(0, 3).map((spec, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {spec}
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  {selectedLawyer.experience_years && (
                    <p className="text-sm text-muted-foreground">
                      {selectedLawyer.experience_years} {t("pages:questionform.years_experience")}
                    </p>
                  )}
                  
                  {selectedLawyer.chat_fee && (
                    <div className="bg-blue-50 p-2 rounded">
                      <p className="text-sm">
                        <strong>{t("chat_fee")}:</strong> ${selectedLawyer.chat_fee}/session
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* How it Works */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t("pages:questionform.how_public_qa_works")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-blue-600">1</span>
                </div>
                <div>
                  <p className="text-sm font-medium">{t("pages:questionform.submit_your_question")}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("pages:questionform.question_posted_publicly_description")}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-blue-600">2</span>
                </div>
                <div>
                  <p className="text-sm font-medium">{t("pages:questionform.lawyers_respond")}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("pages:questionform.lawyers_provide_free_answers")}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-blue-600">3</span>
                </div>
                <div>
                  <p className="text-sm font-medium">{t("pages:questionform.get_detailed_help")}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("pages:questionform.private_consultation_description")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Available Lawyers */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                {t("pages:questionform.available_lawyers")} ({lawyers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingLawyers ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : lawyers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t("pages:questionform.no_lawyers_available")}
                </p>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {lawyers.slice(0, 5).map((lawyer) => (
                    <div key={lawyer._id} className="flex items-center gap-2 p-2 rounded border">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={lawyer.profile_image} />
                        <AvatarFallback className="text-xs">
                          {lawyer.first_name[0]}{lawyer.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {lawyer.first_name} {lawyer.last_name}
                        </p>
                        {lawyer.specialization && lawyer.specialization[0] && (
                          <p className="text-xs text-muted-foreground truncate">
                            {lawyer.specialization[0]}
                          </p>
                        )}
                      </div>
                      {lawyer.is_available && (
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      )}
                    </div>
                  ))}
                  {lawyers.length > 5 && (
                    <p className="text-xs text-muted-foreground text-center">
                      +{lawyers.length - 5} {t("pages:questionform.more_lawyers_available")}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}